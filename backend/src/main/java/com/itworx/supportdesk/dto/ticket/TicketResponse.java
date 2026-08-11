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
        String title,
        String description,
        UUID customerId,
        String customerName,
        UUID orderId,
        UUID assignedAgentId,
        String assignedAgentName,
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
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getCustomer() != null ? ticket.getCustomer().getId() : null,
                ticket.getCustomer() != null ? ticket.getCustomer().getName() : null,
                ticket.getOrder() != null ? ticket.getOrder().getId() : null,
                ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getId() : null,
                ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getName() : null,
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getEscalationReason(),
                ticket.getEscalatedAt(),
                ticket.getCreatedAt(),
                ticket.getModifiedAt()
        );
    }
}
