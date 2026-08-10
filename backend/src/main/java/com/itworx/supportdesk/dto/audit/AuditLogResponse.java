package com.itworx.supportdesk.dto.audit;

import com.itworx.supportdesk.model.audit.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        Instant timestamp,
        String actor,
        String action,
        String target,
        String detail,
        String conversationId
) {
    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getCreatedAt(),
                log.getActorLabel(),
                log.getAction(),
                log.getTarget(),
                log.getDetail(),
                log.getConversationId()
        );
    }
}
