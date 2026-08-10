package com.itworx.supportdesk.exception;

import java.util.UUID;

public class KbArticleNotFoundException extends RuntimeException {

    public KbArticleNotFoundException(UUID id) {
        super("Knowledge base article not found: " + id);
    }
}
