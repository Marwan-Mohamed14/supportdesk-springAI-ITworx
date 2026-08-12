package com.itworx.supportdesk.entity;

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
 * Epic H — Refund Approvals.
 * <p>
 * A refund request raised against an order (identified here by its plain
 * order number / customer name, not a hard FK — the assistant/agent flow
 * that will eventually create these doesn't exist yet, so this mirrors the
 * shape the admin page has always displayed rather than inventing a
 * relation nothing populates). An admin decides it via
 * {@code POST /api/refunds/{id}/approve|reject}; see RefundServiceImpl for
 * the over-limit justification rule (story H5) and audit logging.
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
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank
    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @NotBlank
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String reason;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundStatus status = RefundStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "decided_by")
    private String decidedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt;

    protected Refund() {
    }

    public Refund(String code, String orderNumber, String customerName, BigDecimal amount,
                  String reason, String requestedBy, Instant requestedAt) {
        this.code = code;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.amount = amount;
        this.reason = reason;
        this.requestedBy = requestedBy;
        this.requestedAt = requestedAt;
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
        return "Refund{id=" + id + ", code='" + code + "', status=" + status + "}";
    }
}
