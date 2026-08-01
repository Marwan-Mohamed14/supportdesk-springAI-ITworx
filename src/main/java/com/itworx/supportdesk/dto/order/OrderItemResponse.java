package com.itworx.supportdesk.dto.order;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID id,
        UUID productId,
        String productSku,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal) {}