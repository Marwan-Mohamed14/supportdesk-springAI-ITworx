package com.itworx.supportdesk.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockUpdateRequest(

        @NotNull(message = "stock is required")
        @Min(value = 0, message = "stock must be >= 0")
        Integer stock,

        @NotNull(message = "active is required")
        Boolean active
) {
}