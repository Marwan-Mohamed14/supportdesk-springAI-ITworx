package com.itworx.supportdesk.dto.refund;

import com.itworx.supportdesk.model.refund.Refund;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RefundResponse(
        UUID id,
        String refundNumber,
        UUID orderId,
        String orderNumber,
        UUID customerId,
        String customerName,
        BigDecimal amount,
        BigDecimal orderTotal,
        String reason,
        String requestedByName,
        Instant requestedAt,
        String status,
        String note,
        String decidedByName,
        Instant decidedAt
) {
    public static RefundResponse from(Refund refund) {
        var order = refund.getOrder();
        var customer = order.getCustomer();
        return new RefundResponse(
                refund.getId(),
                refund.getRefundNumber(),
                order.getId(),
                order.getOrderNumber(),
                customer != null ? customer.getId() : null,
                customer != null ? customer.getName() : null,
                refund.getAmount(),
                order.getTotalAmount(),
                refund.getReason(),
                refund.getRequestedBy() != null ? refund.getRequestedBy().getName() : null,
                refund.getCreatedAt(),
                refund.getStatus().name(),
                refund.getNote(),
                refund.getDecidedBy() != null ? refund.getDecidedBy().getName() : null,
                refund.getDecidedAt()
        );
    }
}
