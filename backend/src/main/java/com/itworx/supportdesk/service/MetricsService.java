package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.MetricsSummaryResponse;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.OptionalDouble;

/*
 * Epic L2 — real operational metrics computed from actual ticket data.
 *
 * Only counts what the schema can actually support today:
 *   - ticketsOpen          -> tickets whose status isn't CLOSED (OPEN,
 *                             IN_PROGRESS, ESCALATED all count as "open")
 *   - ticketsResolvedToday -> CLOSED tickets whose modifiedAt falls on
 *                             today's calendar date (local server time)
 *   - avgResolutionMins    -> average(modifiedAt - createdAt) across all
 *                             CLOSED tickets, in minutes; null if none yet
 *   - escalationRate       -> % of ALL tickets currently in ESCALATED status
 *
 * modifiedAt is a safe proxy for "closed at": TicketService#closeTicket
 * refuses to close an already-CLOSED ticket, and assignTicket/escalateTicket
 * both refuse to touch a CLOSED ticket either - so once a ticket is CLOSED,
 * modifiedAt is never written again, and reliably records the moment it
 * was closed.
 *
 * Deliberately NOT included: "tickets by category" and "tool-call volume
 * by type" from the original page mockup. Tickets have no category field,
 * and no tool-call is logged anywhere in this backend, so there is no real
 * data to compute either from. Faking them would be worse than omitting
 * them - see metrics.jsx for the honest "not available yet" placeholder.
 */
@Service
public class MetricsService {

    @Autowired
    TicketRepository ticketRepository;

    public MetricsSummaryResponse getSummary() {
        long total = ticketRepository.count();
        long open = ticketRepository.countByStatusNot(TicketStatus.CLOSED);
        long escalated = ticketRepository.countByStatus(TicketStatus.ESCALATED);

        List<Ticket> closed = ticketRepository.findByStatus(TicketStatus.CLOSED);

        Instant startOfToday = LocalDate.now(ZoneId.systemDefault())
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant();

        long resolvedToday = closed.stream()
                .filter(t -> t.getModifiedAt() != null && !t.getModifiedAt().isBefore(startOfToday))
                .count();

        OptionalDouble avgOpt = closed.stream()
                .filter(t -> t.getCreatedAt() != null && t.getModifiedAt() != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getModifiedAt()).toMinutes())
                .average();
        Double avgResolutionMins = avgOpt.isPresent() ? round1(avgOpt.getAsDouble()) : null;

        double escalationRate = total == 0 ? 0.0 : round1(escalated * 100.0 / total);

        return new MetricsSummaryResponse(open, resolvedToday, avgResolutionMins, escalationRate);
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
