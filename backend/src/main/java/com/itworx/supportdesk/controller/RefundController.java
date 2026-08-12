package com.itworx.supportdesk.controller;

import com.itworx.supportdesk.dto.RefundDecisionRequest;
import com.itworx.supportdesk.dto.RefundResponse;
import com.itworx.supportdesk.service.RefundService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/refunds")
public class RefundController {

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @GetMapping
    public List<RefundResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean overLimit
    ) {
        return refundService.list(status, overLimit);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<RefundResponse> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) RefundDecisionRequest request,
            Authentication authentication
    ) {
        String note = request != null ? request.note() : null;
        return ResponseEntity.ok(refundService.approve(id, note, authentication.getName()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<RefundResponse> reject(
            @PathVariable UUID id,
            @RequestBody RefundDecisionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(refundService.reject(id, request.note(), authentication.getName()));
    }
}
