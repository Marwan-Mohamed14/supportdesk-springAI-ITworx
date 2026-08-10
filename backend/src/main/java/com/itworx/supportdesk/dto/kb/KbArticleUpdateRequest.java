package com.itworx.supportdesk.dto.kb;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record KbArticleUpdateRequest(

        @NotBlank(message = "title is required")
        String title,

        @NotBlank(message = "category is required")
        String category,

        List<String> tags,

        String body
) {
}
