package com.itworx.supportdesk.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Epic K — Audit Trail.
 * <p>
 * Any endpoint that performs an action worth recording calls
 * AuditLogService.record(...), which persists one row here (createdAt is
 * left null so onCreate() below stamps it "now"). Refund approve/reject is
 * the first real writer (see RefundServiceImpl).
 * <p>
 * seedKey is unrelated to that write path - it's only set by DataSeeder to
 * make historical demo rows idempotent (existsBySeedKey), the same pattern
 * as Refund.code / KbArticle.title. Real, live-written rows never set it.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_log_entries")
public class AuditLogEntry {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false)
    private String actor;

    @Column
    private String target;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "seed_key", unique = true, length = 20)
    private String seedKey;

    protected AuditLogEntry() {
    }

    public AuditLogEntry(String action, String actor, String target, String detail) {
        this.action = action;
        this.actor = actor;
        this.target = target;
        this.detail = detail;
    }

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
