package com.itworx.supportdesk.model.audit;

import com.itworx.supportdesk.model.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Epic K, story K4 - every side-effectful tool/admin action (refund
 * approve/reject, KB create/edit/ingest, etc.) is written here. Strictly
 * append-only: nothing in this codebase updates or deletes an AuditLog row.
 *
 * `actorUser` is set when the action was taken by a signed-in human (most
 * cases today, since Epic H's AI tool-calling isn't built yet); `actorLabel`
 * is always set and is what the UI displays, so a future actorless/system
 * action (e.g. an AI tool call) can still be recorded without a User row.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actorUser;

    @NotBlank
    @Column(name = "actor_label", nullable = false, length = 150)
    private String actorLabel;

    @NotBlank
    @Column(nullable = false, length = 60)
    private String action;

    @Column(length = 250)
    private String target;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "conversation_id", length = 100)
    private String conversationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() {
    }

    public AuditLog(User actorUser, String actorLabel, String action, String target, String detail, String conversationId) {
        this.actorUser = actorUser;
        this.actorLabel = actorLabel;
        this.action = action;
        this.target = target;
        this.detail = detail;
        this.conversationId = conversationId;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AuditLog auditLog)) return false;
        return id != null && id.equals(auditLog.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "AuditLog{id=" + id + ", action='" + action + "', target='" + target + "'}";
    }
}
