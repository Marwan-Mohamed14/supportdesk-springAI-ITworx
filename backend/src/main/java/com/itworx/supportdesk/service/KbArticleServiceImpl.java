package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.KbArticleCreateRequest;
import com.itworx.supportdesk.dto.KbArticleResponse;
import com.itworx.supportdesk.dto.KbArticleUpdateRequest;
import com.itworx.supportdesk.entity.KbArticle;
import com.itworx.supportdesk.exception.KbArticleNotFoundException;
import com.itworx.supportdesk.repository.KbArticleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/*
 * Epic F1/F2 - Knowledge Base articles, genuinely persisted in the
 * database (previously this whole page only ever touched in-memory
 * React state and never called a backend at all).
 *
 * Scope note: "ingest" here is what this backend can honestly support
 * today - marking an article published and stamping lastIngestedAt.
 * It does NOT push the article's body into the chatbot's vector store
 * (see AiConfig / KnowledgeBaseLoader / ChatbotService) - wiring that up
 * is a separate, larger change to the existing RAG pipeline and is
 * intentionally left alone here so this fix can't destabilize it.
 */
@Service
@Transactional
public class KbArticleServiceImpl implements KbArticleService {

    private final KbArticleRepository kbArticleRepository;

    public KbArticleServiceImpl(KbArticleRepository kbArticleRepository) {
        this.kbArticleRepository = kbArticleRepository;
    }

    @Override
    public KbArticleResponse create(KbArticleCreateRequest request) {
        KbArticle article = new KbArticle(request.title(), request.category(), request.tags(), request.body());
        return KbArticleResponse.from(kbArticleRepository.save(article));
    }

    @Override
    @Transactional(readOnly = true)
    public List<KbArticleResponse> list() {
        return kbArticleRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(KbArticleResponse::from)
                .toList();
    }

    @Override
    public KbArticleResponse update(UUID id, KbArticleUpdateRequest request) {
        KbArticle article = findOrThrow(id);
        article.setTitle(request.title());
        article.setCategory(request.category());
        article.setTags(request.tags() != null ? request.tags() : java.util.List.of());
        article.setBody(request.body());
        // Edited content no longer matches whatever was last ingested (if
        // anything was) - same "stale" signal the original page used.
        article.setStatus("stale");
        return KbArticleResponse.from(kbArticleRepository.save(article));
    }

    @Override
    public KbArticleResponse ingest(UUID id) {
        KbArticle article = findOrThrow(id);
        article.setStatus("published");
        article.setLastIngestedAt(Instant.now());
        return KbArticleResponse.from(kbArticleRepository.save(article));
    }

    @Override
    public List<KbArticleResponse> ingestAll() {
        List<KbArticle> all = kbArticleRepository.findAll();
        Instant now = Instant.now();
        all.forEach(a -> {
            a.setStatus("published");
            a.setLastIngestedAt(now);
        });
        return kbArticleRepository.saveAll(all).stream().map(KbArticleResponse::from).toList();
    }

    private KbArticle findOrThrow(UUID id) {
        return kbArticleRepository.findById(id)
                .orElseThrow(() -> KbArticleNotFoundException.forId(id));
    }
}
