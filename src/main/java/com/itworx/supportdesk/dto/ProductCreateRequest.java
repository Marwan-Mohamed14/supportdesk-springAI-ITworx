package com.itworx.supportdesk.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;


public record ProductCreateRequest(

        @NotBlank(message = "sku is required")
        String sku,

        @NotBlank(message = "name is required")
        String name,

        @NotNull(message = "price is required")
        @Min(value = 0, message = "price must be >= 0")
        BigDecimal price,

        String category,

        @NotNull(message = "stock is required")
        @Min(value = 0, message = "stock must be >= 0")
        Integer stock
) {
}