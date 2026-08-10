package com.itworx.supportdesk.dto.kb;

import com.itworx.supportdesk.model.kb.KbArticle;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record KbArticleResponse(
        UUID id,
        String title,
        String category,
        List<String> tags,
        String body,
        String status,
        Instant lastIngestedAt,
        Instant createdAt,
        Instant modifiedAt
) {
    public static KbArticleResponse from(KbArticle article) {
        return new KbArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getCategory(),
                article.getTags(),
                article.getBody(),
                article.getStatus().name(),
                article.getLastIngestedAt(),
                article.getCreatedAt(),
                article.getModifiedAt()
        );
    }
}
