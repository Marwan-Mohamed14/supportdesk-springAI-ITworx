package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.metrics.MetricsSummaryResponse;
import com.itworx.supportdesk.service.metrics.MetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Epic L, story L2. ADMIN-only, enforced in SecurityConfig. See
 * MetricsService for the (from=/to= aren't applied yet - every number here
 * is "since the beginning" until a real reporting window is added; this
 * keeps the first cut honest rather than half-implementing date filtering).
 */
@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/summary")
    public MetricsSummaryResponse summary() {
        return metricsService.summary();
    }
}
