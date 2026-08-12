package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.entity.KbArticle;

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
    public static KbArticleResponse from(KbArticle a) {
        return new KbArticleResponse(
                a.getId(),
                a.getTitle(),
                a.getCategory(),
                a.getTags(),
                a.getBody(),
                a.getStatus(),
                a.getLastIngestedAt(),
                a.getCreatedAt(),
                a.getModifiedAt()
        );
    }
}
