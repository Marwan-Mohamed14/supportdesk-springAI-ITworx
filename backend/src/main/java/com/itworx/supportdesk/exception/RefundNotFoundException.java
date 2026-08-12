package com.itworx.supportdesk.exception;

import java.util.UUID;

public class RefundNotFoundException extends RuntimeException {

    private RefundNotFoundException(String message) {
        super(message);
    }

    public static RefundNotFoundException forId(UUID id) {
        return new RefundNotFoundException("Refund not found with id: " + id);
    }
}
