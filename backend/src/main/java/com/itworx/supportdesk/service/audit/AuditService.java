package com.itworx.supportdesk.service.audit;

import com.itworx.supportdesk.dto.audit.AuditLogResponse;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.audit.AuditLog;
import com.itworx.supportdesk.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Epic K, story K4 - shared write path for the audit trail. Every endpoint
 * that performs a side-effectful action (refund approve/reject, KB
 * create/edit/ingest today; AI tool calls once Epic H exists) calls
 * {@link #record} instead of writing an AuditLog row directly, so the shape
 * of an entry stays consistent no matter which feature produced it.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(User actorUser, String action, String target, String detail) {
        record(actorUser, action, target, detail, null);
    }

    @Transactional
    public void record(User actorUser, String action, String target, String detail, String conversationId) {
        // Every action recorded so far is taken by an authenticated ADMIN
        // (see SecurityConfig - refunds/KB writes are ADMIN-only), so the
        // display label is straightforward. Epic H's AI tool actions will
        // pass actorUser=null with an actorLabel like "AI Assistant" once
        // that tool-calling loop exists.
        String actorLabel = actorUser != null ? actorUser.getName() + " (ADMIN)" : "AI Assistant";
        AuditLog log = new AuditLog(actorUser, actorLabel, action, target, detail, conversationId);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String q, String action, String actor, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.search(q, action, actor, from, to, pageable)
                .map(AuditLogResponse::from);
    }
}
