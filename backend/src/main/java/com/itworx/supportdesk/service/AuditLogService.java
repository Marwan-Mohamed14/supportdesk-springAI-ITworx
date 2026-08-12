package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.AuditLogResponse;
import com.itworx.supportdesk.entity.AuditLogEntry;
import com.itworx.supportdesk.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Epic K — Audit Trail.
 * <p>
 * record(...) is the write side: any endpoint that performs an action worth
 * recording calls it (refund approve/reject today, see RefundServiceImpl).
 * list(...) is the read side backing GET /api/audit
 * (frontend/src/pages/admin/audit.jsx) - the page used to show a hardcoded
 * demo list; it now reads real rows from this table.
 * <p>
 * NOTE: only refund decisions write rows here so far. KB edits, ticket
 * escalations, and logins aren't instrumented to call record(...) yet, so
 * they won't appear in the trail until that's added as a follow-up.
 */
@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(String action, String actor, String target, String detail) {
        auditLogRepository.save(new AuditLogEntry(action, actor, target, detail));
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> list(String q, String action, String actor, Instant from, Instant to) {
        String needle = q == null ? null : q.trim().toLowerCase();
        String actorNeedle = actor == null ? null : actor.trim().toLowerCase();

        return auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(e -> action == null || action.isBlank() || "all".equalsIgnoreCase(action)
                        || e.getAction().equalsIgnoreCase(action))
                .filter(e -> actorNeedle == null || actorNeedle.isBlank()
                        || (e.getActor() != null && e.getActor().toLowerCase().contains(actorNeedle)))
                .filter(e -> needle == null || needle.isBlank() || matches(e, needle))
                .filter(e -> from == null || (e.getCreatedAt() != null && !e.getCreatedAt().isBefore(from)))
                .filter(e -> to == null || (e.getCreatedAt() != null && !e.getCreatedAt().isAfter(to)))
                .map(AuditLogResponse::from)
                .toList();
    }

    private boolean matches(AuditLogEntry e, String needle) {
        return contains(e.getActor(), needle) || contains(e.getTarget(), needle) || contains(e.getDetail(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }
}
