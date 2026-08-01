package com.itworx.supportdesk.dto.customer;

import com.itworx.supportdesk.model.Ticket.Ticket;

import java.time.Instant;
import java.util.UUID;

public record TicketSummary(
        UUID id,
        String ticketNumber,
        String status,
        String priority,
        Instant createdAt
) {
    public static TicketSummary from(Ticket ticket) {
        return new TicketSummary(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getStatus().name(),
                ticket.getPriority() != null ? ticket.getPriority().name() : null,
                ticket.getCreatedAt()
        );
    }
}
