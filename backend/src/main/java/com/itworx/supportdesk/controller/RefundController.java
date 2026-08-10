package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.PageResponse;
import com.itworx.supportdesk.dto.refund.CreateRefundRequest;
import com.itworx.supportdesk.dto.refund.RefundDecisionRequest;
import com.itworx.supportdesk.dto.refund.RefundResponse;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.refund.RefundStatus;
import com.itworx.supportdesk.repository.UserRepository;
import com.itworx.supportdesk.service.refund.RefundService;
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
 * Epic H, story H5. Creating a request just needs any authenticated caller
 * (an agent flagging a refund a customer needs); approving/rejecting it -
 * where money is actually committed to move - is ADMIN-only, enforced in
 * SecurityConfig.
 */
@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    private final RefundService refundService;
    private final UserRepository userRepository;

    public RefundController(RefundService refundService, UserRepository userRepository) {
        this.refundService = refundService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<RefundResponse> create(@Valid @RequestBody CreateRefundRequest request, Principal principal) {
        RefundResponse created = refundService.create(request, currentUser(principal));
        return ResponseEntity
                .created(URI.create("/api/refunds/" + created.id()))
                .body(created);
    }

    @GetMapping
    public PageResponse<RefundResponse> search(
            @RequestParam(required = false) RefundStatus status,
            @RequestParam(required = false, defaultValue = "false") boolean overLimit,
            @PageableDefault(size = 50)
            @SortDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<RefundResponse> page = refundService.search(status, overLimit, pageable);
        return PageResponse.from(page);
    }

    @PostMapping("/{id}/approve")
    public RefundResponse approve(@PathVariable UUID id, @RequestBody(required = false) RefundDecisionRequest request, Principal principal) {
        return refundService.approve(id, requestOrEmpty(request), currentUser(principal));
    }

    @PostMapping("/{id}/reject")
    public RefundResponse reject(@PathVariable UUID id, @RequestBody(required = false) RefundDecisionRequest request, Principal principal) {
        return refundService.reject(id, requestOrEmpty(request), currentUser(principal));
    }

    private RefundDecisionRequest requestOrEmpty(RefundDecisionRequest request) {
        return request != null ? request : new RefundDecisionRequest(null);
    }

    private User currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + principal.getName()));
    }
}
