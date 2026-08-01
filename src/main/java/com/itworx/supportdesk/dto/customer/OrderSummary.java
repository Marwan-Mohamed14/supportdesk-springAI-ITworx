package com.itworx.supportdesk.dto.customer;

import com.itworx.supportdesk.model.order.Order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummary(
        UUID id,
        String orderNumber,
        String status,
        BigDecimal totalAmount,
        Instant createdAt
) {
    public static OrderSummary from(Order order) {
        return new OrderSummary(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }
}
