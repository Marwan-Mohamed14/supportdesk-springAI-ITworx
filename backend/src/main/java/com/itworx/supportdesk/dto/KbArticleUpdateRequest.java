package com.itworx.supportdesk.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record KbArticleUpdateRequest(

        @NotBlank(message = "title is required")
        String title,

        @NotBlank(message = "category is required")
        String category,

        List<String> tags,

        @NotBlank(message = "body is required")
        String body
) {
}
