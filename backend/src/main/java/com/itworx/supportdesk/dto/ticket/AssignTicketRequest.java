package com.itworx.supportdesk.dto.ticket;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body for POST /api/tickets/{id}/assign
 *
 * agentId is the id of the User (agent) the ticket should be assigned to.
 * The caller can pass their own id to "assign to myself" or a colleague's id.
 */
public record AssignTicketRequest(
        @NotNull(message = "agentId is required")
        UUID agentId
) {
}
