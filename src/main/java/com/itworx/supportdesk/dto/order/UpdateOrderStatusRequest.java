package com.itworx.supportdesk.dto.order;

import com.itworx.supportdesk.model.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "Status is not allowed to be null")
        OrderStatus status
) {}