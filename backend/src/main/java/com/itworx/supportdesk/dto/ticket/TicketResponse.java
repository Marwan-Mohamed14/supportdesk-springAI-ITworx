package com.itworx.supportdesk.dto.ticket;

import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Flat, read-only view of a Ticket returned by the API.
 */
public record TicketResponse(
        UUID id,
        String ticketNumber,
        UUID customerId,
        UUID orderId,
        UUID assignedAgentId,
        TicketStatus status,
        TicketPriority priority,
        String escalationReason,
        Instant escalatedAt,
        Instant createdAt,
        Instant modifiedAt
) {
    public static TicketResponse from(Ticket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getCustomer() != null ? ticket.getCustomer().getId() : null,
                ticket.getOrder() != null ? ticket.getOrder().getId() : null,
                ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getId() : null,
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getEscalationReason(),
                ticket.getEscalatedAt(),
                ticket.getCreatedAt(),
                ticket.getModifiedAt()
        );
    }
}
