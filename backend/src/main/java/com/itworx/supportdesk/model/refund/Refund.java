package com.itworx.supportdesk.model.refund;

import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Epic H, story H5 - a refund proposal that must be explicitly approved or
 * rejected by an admin before anything else happens. This entity/service
 * only model the human-in-the-loop approval side of H5; the assistant
 * calling an issueRefund tool automatically (the rest of Epic H) needs the
 * agentic tool-calling loop that doesn't exist yet in this codebase and is
 * out of scope here - requestedBy is whichever authenticated user files the
 * request (agent or admin) until that tool exists.
 */
@Getter
@Setter
@Entity
@Table(name = "refunds")
public class Refund {

    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID id;

    @NotBlank
    @Column(name = "refund_number", nullable = false, unique = true, length = 30)
    private String refundNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 1000)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundStatus status = RefundStatus.PENDING;

    // The approve/reject note. Required on reject and on any approval at or
    // above the auto-approve limit (story H5) - enforced in RefundService.
    @Column(length = 1000)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by")
    private User decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt;

    protected Refund() {
    }

    public Refund(String refundNumber, Order order, BigDecimal amount, String reason, User requestedBy) {
        this.refundNumber = refundNumber;
        this.order = order;
        this.amount = amount;
        this.reason = reason;
        this.requestedBy = requestedBy;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.modifiedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.modifiedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Refund refund)) return false;
        return id != null && id.equals(refund.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Refund{id=" + id + ", refundNumber='" + refundNumber + "', status=" + status + "}";
    }
}
