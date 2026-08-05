package com.itworx.supportdesk.dto;

import com.itworx.supportdesk.entity.Product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String name,
        BigDecimal price,
        String category,
        Boolean active,
        Integer stock,
        Integer totalAssignedItems,
        Integer totalDecommissioned,
        Integer totalUnits,
        Instant createdAt,
        Instant modifiedAt
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getPrice(),
                product.getCategory(),
                product.getActive(),
                product.getStock(),
                product.getTotalAssignedItems(),
                product.getTotalDecommissioned(),
                product.getTotalUnits(),
                product.getCreatedAt(),
                product.getModifiedAt()
        );
    }
}