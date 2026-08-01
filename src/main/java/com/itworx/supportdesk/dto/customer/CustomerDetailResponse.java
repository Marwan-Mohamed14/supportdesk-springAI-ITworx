package com.itworx.supportdesk.dto.customer;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response for GET /api/customers/{id} (story C2): the customer plus their
 * order and ticket history, newest first.
 */
public record CustomerDetailResponse(
        UUID id,
        String name,
        String email,
        Instant createdAt,
        Instant modifiedAt,
        List<OrderSummary> orders,
        List<TicketSummary> tickets
) {
}
