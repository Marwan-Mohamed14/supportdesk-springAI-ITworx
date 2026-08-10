package com.itworx.supportdesk.model.kb;

import com.itworx.supportdesk.model.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Epic F - a knowledge-base article the admin console authors and, once
 * ingested (see KbArticleService.ingest), grounds the assistant's answers
 * (Epic G reads from the same VectorStore this ingests into).
 *
 * status starts DRAFT on create, becomes STALE on any edit (F2: an edited
 * article needs re-ingesting before its new content is searchable), and
 * becomes PUBLISHED once ingest succeeds.
 */
@Getter
@Setter
@Entity
@Table(name = "kb_articles")
public class KbArticle {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String category;

    @ElementCollection
    @CollectionTable(name = "kb_article_tags", joinColumns = @JoinColumn(name = "kb_article_id"))
    @Column(name = "tag", length = 60)
    @OrderColumn(name = "tag_order")
    private List<String> tags = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String body;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private KbArticleStatus status = KbArticleStatus.DRAFT;

    @Column(name = "last_ingested_at")
    private Instant lastIngestedAt;

    // Vector-store document ids produced by the most recent successful ingest
    // of this article - kept so a future re-ingest can delete exactly these
    // before adding the new chunk(s), which is how F2's "old chunks replaced,
    // no stale duplicates" requirement is satisfied without needing to assume
    // the vector store lets callers choose a document's id up front.
    @ElementCollection
    @CollectionTable(name = "kb_article_vector_chunk_ids", joinColumns = @JoinColumn(name = "kb_article_id"))
    @Column(name = "chunk_id", length = 100)
    private List<String> vectorChunkIds = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modified_by")
    private User modifiedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt;

    protected KbArticle() {
    }

    public KbArticle(String title, String category, List<String> tags, String body) {
        this.title = title;
        this.category = category;
        this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
        this.body = body;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.modifiedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.modifiedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof KbArticle that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "KbArticle{id=" + id + ", title='" + title + "', status=" + status + "}";
    }
}
