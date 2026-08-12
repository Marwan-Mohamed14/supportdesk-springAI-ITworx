package com.itworx.supportdesk.dto;

/*
 * Epic L2 — real operational metrics, computed from what the schema
 * actually supports today (see MetricsService for the exact rules).
 *
 * Deliberately does NOT include a ticket-category breakdown or a
 * tool-call-volume breakdown: tickets have no category field, and no
 * tool-call is ever logged anywhere in the backend, so those two numbers
 * cannot be computed for real yet. The frontend shows an honest
 * "not available yet" placeholder for both instead of inventing data.
 */
public record MetricsSummaryResponse(
        long ticketsOpen,
        long ticketsResolvedToday,
        Double avgResolutionMins,
        double escalationRate
) {
}
