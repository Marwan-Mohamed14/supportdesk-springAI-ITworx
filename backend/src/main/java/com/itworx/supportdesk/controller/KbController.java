package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.PageResponse;
import com.itworx.supportdesk.dto.kb.KbArticleCreateRequest;
import com.itworx.supportdesk.dto.kb.KbArticleResponse;
import com.itworx.supportdesk.dto.kb.KbArticleUpdateRequest;
import com.itworx.supportdesk.dto.kb.KbIngestRequest;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.kb.KbArticleStatus;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.service.kb.KbArticleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.UUID;

/**
 * Epic F. ADMIN-only end to end (enforced in SecurityConfig) - there is no
 * agent-facing view of the knowledge base console (story A2).
 */
@RestController
@RequestMapping("/api/kb")
public class KbController {

    private final KbArticleService kbArticleService;
    private final UserRepository userRepository;

    public KbController(KbArticleService kbArticleService, UserRepository userRepository) {
        this.kbArticleService = kbArticleService;
        this.userRepository = userRepository;
    }

    @GetMapping("/articles")
    public PageResponse<KbArticleResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) KbArticleStatus status,
            @PageableDefault(size = 50)
            @SortDefault(sort = "title")
            Pageable pageable
    ) {
        Page<KbArticleResponse> page = kbArticleService.search(q, category, status, pageable);
        return PageResponse.from(page);
    }

    @PostMapping("/articles")
    public ResponseEntity<KbArticleResponse> create(@Valid @RequestBody KbArticleCreateRequest request, Principal principal) {
        KbArticleResponse created = kbArticleService.create(request, currentUser(principal));
        return ResponseEntity
                .created(URI.create("/api/kb/articles/" + created.id()))
                .body(created);
    }

    @PutMapping("/articles/{id}")
    public KbArticleResponse update(@PathVariable UUID id, @Valid @RequestBody KbArticleUpdateRequest request, Principal principal) {
        return kbArticleService.update(id, request, currentUser(principal));
    }

    @PostMapping("/ingest")
    public ResponseEntity<Void> ingest(@RequestBody(required = false) KbIngestRequest request, Principal principal) {
        UUID articleId = request != null ? request.articleId() : null;
        kbArticleService.ingest(articleId, currentUser(principal));
        return ResponseEntity.ok().build();
    }

    private User currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + principal.getName()));
    }
}
