package com.itworx.supportdesk.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        String status,
        LocalDateTime orderDate,
        BigDecimal totalAmount,
        List<OrderItemResponse> items) {}