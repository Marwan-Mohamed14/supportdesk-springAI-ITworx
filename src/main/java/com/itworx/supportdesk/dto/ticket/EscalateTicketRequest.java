package com.itworx.supportdesk.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/tickets/{id}/escalate
 */
public record EscalateTicketRequest(
        @NotBlank(message = "reason is required")
        @Size(max = 1000, message = "reason must be at most 1000 characters")
        String reason
) {
}