package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.MetricsSummaryResponse;
import com.itworx.supportdesk.service.MetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Epic L2 - admin-only operational metrics. ADMIN enforcement lives in
// SecurityConfig (/api/metrics/** -> hasRole("ADMIN")), matching how
// /api/products write endpoints are protected there instead of here.
@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/summary")
    public MetricsSummaryResponse summary() {
        return metricsService.getSummary();
    }
}
