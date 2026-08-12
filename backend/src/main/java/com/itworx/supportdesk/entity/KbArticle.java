package com.itworx.supportdesk.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Epic F1/F2 - Knowledge Base articles the admin console authors.
//
// Scope note: "status" here tracks whether the article's content has been
// (re-)ingested since it was last edited - draft -> never ingested,
// published -> ingested and unchanged since, stale -> edited since it was
// last ingested. This does NOT push the article into the chatbot's vector
// store (see AiConfig / KnowledgeBaseLoader / ChatbotService) - actually
// wiring an article's body into the RAG pipeline is a separate, larger
// change to that existing system and is deliberately left alone here.
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
    @CollectionTable(name = "kb_article_tags", joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "tag", length = 50)
    private List<String> tags = new ArrayList<>();

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @NotBlank
    @Column(nullable = false, length = 20)
    private String status = "draft";

    @Column(name = "last_ingested_at")
    private Instant lastIngestedAt;

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
        this.status = "draft";
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
