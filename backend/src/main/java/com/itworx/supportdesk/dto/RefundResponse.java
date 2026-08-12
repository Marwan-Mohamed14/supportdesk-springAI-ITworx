package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.entity.Refund;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
        UUID id,
        String code,
        String orderNumber,
        String customerName,
        BigDecimal amount,
        String reason,
        String requestedBy,
        Instant requestedAt,
        String status,
        String note,
        String decidedBy,
        Instant decidedAt
) {
    public static RefundResponse from(Refund r) {
        return new RefundResponse(
                r.getId(),
                r.getCode(),
                r.getOrderNumber(),
                r.getCustomerName(),
                r.getAmount(),
                r.getReason(),
                r.getRequestedBy(),
                r.getRequestedAt(),
                r.getStatus().name().toLowerCase(),
                r.getNote(),
                r.getDecidedBy(),
                r.getDecidedAt()
        );
    }
}
