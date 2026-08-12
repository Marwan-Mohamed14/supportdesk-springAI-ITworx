package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.KbArticleCreateRequest;
import com.itworx.supportdesk.dto.KbArticleResponse;
import com.itworx.supportdesk.dto.KbArticleUpdateRequest;
import com.itworx.supportdesk.service.KbArticleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

// Epic F1/F2 - admin-only Knowledge Base authoring. ADMIN enforcement lives
// in SecurityConfig (/api/kb/** -> hasRole("ADMIN")), same pattern used for
// /api/products writes and /api/metrics.
@RestController
@RequestMapping("/api/kb/articles")
public class KbArticleController {

    private final KbArticleService kbArticleService;

    public KbArticleController(KbArticleService kbArticleService) {
        this.kbArticleService = kbArticleService;
    }

    @PostMapping
    public ResponseEntity<KbArticleResponse> create(@Valid @RequestBody KbArticleCreateRequest request) {
        KbArticleResponse created = kbArticleService.create(request);
        return ResponseEntity.created(URI.create("/api/kb/articles/" + created.id())).body(created);
    }

    @GetMapping
    public List<KbArticleResponse> list() {
        return kbArticleService.list();
    }

    @PutMapping("/{id}")
    public KbArticleResponse update(@PathVariable UUID id, @Valid @RequestBody KbArticleUpdateRequest request) {
        return kbArticleService.update(id, request);
    }

    @PostMapping("/{id}/ingest")
    public KbArticleResponse ingestOne(@PathVariable UUID id) {
        return kbArticleService.ingest(id);
    }

    @PostMapping("/ingest-all")
    public List<KbArticleResponse> ingestAll() {
        return kbArticleService.ingestAll();
    }
}
