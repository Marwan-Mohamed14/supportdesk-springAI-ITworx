package com.itworx.supportdesk.service.metrics;

import com.itworx.supportdesk.dto.metrics.MetricsSummaryResponse;
import com.itworx.supportdesk.model.Ticket.Ticket;
import com.itworx.supportdesk.model.Ticket.TicketPriority;
import com.itworx.supportdesk.model.Ticket.TicketStatus;
import com.itworx.supportdesk.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Epic L, story L2. See MetricsSummaryResponse for why ticketsByCategory and
 * toolCallsByType aren't included the way the original design doc describes
 * them - those need Epic J and Epic H respectively, neither of which is
 * built yet in this codebase.
 */
@Service
public class MetricsService {

    private static final List<TicketStatus> OPEN_STATUSES =
            List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED);

    private final TicketRepository ticketRepository;

    public MetricsService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public MetricsSummaryResponse summary() {
        long ticketsOpen = ticketRepository.countByStatusIn(OPEN_STATUSES);

        ZoneId zone = ZoneId.systemDefault();
        Instant startOfToday = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant startOfTomorrow = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant();
        long ticketsResolvedToday = ticketRepository.countByStatusAndModifiedAtBetween(
                TicketStatus.CLOSED, startOfToday, startOfTomorrow);

        double avgResolutionMins = averageResolutionMinutes();

        long totalTickets = ticketRepository.count();
        long escalatedTickets = ticketRepository.countByEscalatedAtIsNotNull();
        double escalationRatePercent = totalTickets == 0 ? 0.0 : (escalatedTickets * 100.0) / totalTickets;

        List<MetricsSummaryResponse.CategoryCount> ticketsByPriority = List.of(
                new MetricsSummaryResponse.CategoryCount("LOW", ticketRepository.countByPriority(TicketPriority.LOW)),
                new MetricsSummaryResponse.CategoryCount("MEDIUM", ticketRepository.countByPriority(TicketPriority.MEDIUM)),
                new MetricsSummaryResponse.CategoryCount("HIGH", ticketRepository.countByPriority(TicketPriority.HIGH)),
                new MetricsSummaryResponse.CategoryCount("URGENT", ticketRepository.countByPriority(TicketPriority.URGENT))
        );

        List<String> notes = List.of(
                "Tickets have no category field yet (needs Epic J - ticket classification), " +
                        "so this reports ticketsByPriority instead of ticketsByCategory.",
                "toolCallsByType is empty - it needs Epic H's AI tool-calling loop, which isn't implemented yet."
        );

        return new MetricsSummaryResponse(
                ticketsOpen,
                ticketsResolvedToday,
                avgResolutionMins,
                escalationRatePercent,
                ticketsByPriority,
                List.of(),
                notes
        );
    }

    private double averageResolutionMinutes() {
        List<Ticket> closed = ticketRepository.findByStatus(TicketStatus.CLOSED);
        if (closed.isEmpty()) {
            return 0.0;
        }
        long totalMinutes = 0;
        int counted = 0;
        for (Ticket ticket : closed) {
            if (ticket.getCreatedAt() == null || ticket.getModifiedAt() == null) {
                continue;
            }
            totalMinutes += Duration.between(ticket.getCreatedAt(), ticket.getModifiedAt()).toMinutes();
            counted++;
        }
        return counted == 0 ? 0.0 : (double) totalMinutes / counted;
    }
}
