package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.entity.AuditLogEntry;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String action,
        String actor,
        String target,
        String detail,
        Instant createdAt
) {
    public static AuditLogResponse from(AuditLogEntry e) {
        return new AuditLogResponse(
                e.getId(),
                e.getAction(),
                e.getActor(),
                e.getTarget(),
                e.getDetail(),
                e.getCreatedAt()
        );
    }
}
