package com.itworx.supportdesk.service.kb;

import com.itworx.supportdesk.dto.kb.KbArticleCreateRequest;
import com.itworx.supportdesk.dto.kb.KbArticleResponse;
import com.itworx.supportdesk.dto.kb.KbArticleUpdateRequest;
import com.itworx.supportdesk.exception.KbArticleNotFoundException;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.kb.KbArticle;
import com.itworx.supportdesk.model.kb.KbArticleStatus;
import com.itworx.supportdesk.repository.KbArticleRepository;
import com.itworx.supportdesk.service.audit.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Epic F - author + (re)ingest knowledge-base articles.
 *
 * Ingest deliberately reuses the same {@link VectorStore} bean the chatbot
 * searches (see ChatbotService/AiConfig) rather than a separate store, so an
 * ingested article is immediately part of what grounds the assistant's
 * answers (Epic G) - no second wiring step needed.
 */
@Service
public class KbArticleService {

    private static final Logger log = LoggerFactory.getLogger(KbArticleService.class);

    private final KbArticleRepository kbArticleRepository;
    private final VectorStore vectorStore;
    private final AuditService auditService;

    public KbArticleService(KbArticleRepository kbArticleRepository, VectorStore vectorStore, AuditService auditService) {
        this.kbArticleRepository = kbArticleRepository;
        this.vectorStore = vectorStore;
        this.auditService = auditService;
    }

    @Transactional
    public KbArticleResponse create(KbArticleCreateRequest request, User actor) {
        KbArticle article = new KbArticle(request.title(), request.category(), request.tags(), request.body());
        article.setCreatedBy(actor);
        article.setModifiedBy(actor);
        KbArticle saved = kbArticleRepository.save(article);
        auditService.record(actor, "kb_created", saved.getTitle(), "New article created as draft.");
        return KbArticleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<KbArticleResponse> search(String q, String category, KbArticleStatus status, Pageable pageable) {
        return kbArticleRepository.search(q, category, status, pageable).map(KbArticleResponse::from);
    }

    @Transactional
    public KbArticleResponse update(UUID id, KbArticleUpdateRequest request, User actor) {
        KbArticle article = findOrThrow(id);

        article.setTitle(request.title());
        article.setCategory(request.category());
        article.setTags(request.tags());
        article.setBody(request.body());
        // F2: an edited article must be re-ingested before its new content is
        // searchable, so any edit marks it stale even if it was published.
        article.setStatus(KbArticleStatus.STALE);
        article.setModifiedBy(actor);

        KbArticle saved = kbArticleRepository.save(article);
        auditService.record(actor, "kb_updated", saved.getTitle(), "Edited article - marked for re-ingest.");
        return KbArticleResponse.from(saved);
    }

    /**
     * @param articleId null re-ingests every article; a specific id re-ingests just that one.
     */
    @Transactional
    public void ingest(UUID articleId, User actor) {
        List<KbArticle> toIngest = articleId != null
                ? List.of(findOrThrow(articleId))
                : kbArticleRepository.findAll();

        for (KbArticle article : toIngest) {
            ingestOne(article);
        }

        String target = articleId != null
                ? toIngest.get(0).getTitle()
                : toIngest.size() + " articles";
        auditService.record(actor, "kb_ingested", target, "Re-ingested - old chunks replaced, no stale duplicates.");
    }

    private void ingestOne(KbArticle article) {
        // Delete this article's previous chunks first, so re-ingesting never
        // leaves stale duplicates behind (story F2).
        if (!article.getVectorChunkIds().isEmpty()) {
            try {
                vectorStore.delete(article.getVectorChunkIds());
            } catch (Exception e) {
                // The in-memory store may already be empty (e.g. app restarted
                // since the last ingest) - don't let that block re-ingesting.
                log.warn("Could not delete previous vector chunks for KB article {}: {}", article.getId(), e.getMessage());
            }
        }

        String body = article.getBody() != null ? article.getBody() : "";
        Document document = new Document(
                "[" + article.getCategory() + "] " + article.getTitle() + "\n\n" + body,
                Map.of(
                        "articleId", article.getId().toString(),
                        "title", article.getTitle(),
                        "category", article.getCategory()
                )
        );
        vectorStore.add(List.of(document));

        article.setVectorChunkIds(List.of(document.getId()));
        article.setStatus(KbArticleStatus.PUBLISHED);
        article.setLastIngestedAt(Instant.now());
        kbArticleRepository.save(article);
    }

    private KbArticle findOrThrow(UUID id) {
        return kbArticleRepository.findById(id)
                .orElseThrow(() -> new KbArticleNotFoundException(id));
    }
}
