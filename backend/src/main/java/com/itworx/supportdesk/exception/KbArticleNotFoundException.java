package com.itworx.supportdesk.exception;

import java.util.UUID;

public class KbArticleNotFoundException extends RuntimeException {

    public KbArticleNotFoundException(String message) {
        super(message);
    }

    public static KbArticleNotFoundException forId(UUID id) {
        return new KbArticleNotFoundException("Knowledge base article not found: " + id);
    }
}
