package com.itworx.supportdesk.dto.order;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(
        @NotNull(message = "User ID is required")
        UUID userId,

        @NotEmpty(message = "Order must contain at least one item")
        List<CreateOrderItemRequest> items) {}