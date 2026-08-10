package com.itworx.supportdesk.dto.metrics;

import java.util.List;

/**
 * Epic L, story L2. Only reports numbers this codebase can actually back
 * with real data today:
 *   - ticketsByCategory from the design doc isn't possible yet - Ticket has
 *     no category column (that needs Epic J's ticket classification, which
 *     isn't implemented). ticketsByPriority is reported instead, since
 *     priority is the closest real signal that exists right now.
 *   - toolCallsByType needs Epic H's AI tool-calling loop, which also isn't
 *     implemented, so it comes back empty rather than fabricated.
 * `notes` documents these gaps explicitly instead of silently returning
 * zeros that could be mistaken for "no activity".
 */
public record MetricsSummaryResponse(
        long ticketsOpen,
        long ticketsResolvedToday,
        double avgResolutionMins,
        double escalationRatePercent,
        List<CategoryCount> ticketsByPriority,
        List<CategoryCount> toolCallsByType,
        List<String> notes
) {
    public record CategoryCount(String label, long count) {
    }
}
