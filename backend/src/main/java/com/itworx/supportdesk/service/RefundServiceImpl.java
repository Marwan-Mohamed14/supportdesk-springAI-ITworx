package com.itworx.supportdesk.service;

import com.itworx.supportdesk.dto.RefundResponse;
import com.itworx.supportdesk.entity.Refund;
import com.itworx.supportdesk.entity.RefundStatus;
import com.itworx.supportdesk.exception.InvalidRefundStateException;
import com.itworx.supportdesk.exception.RefundNoteRequiredException;
import com.itworx.supportdesk.exception.RefundNotFoundException;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.repository.RefundRepository;
import com.itworx.supportdesk.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RefundServiceImpl implements RefundService {

    // Mirrors AUTO_APPROVE_LIMIT in frontend/src/pages/admin/refunds.jsx (story H5) -
    // requests at or above this amount need a written justification before they can
    // be approved. Enforced here for real now, not just in the UI.
    private static final BigDecimal AUTO_APPROVE_LIMIT = new BigDecimal("200");

    private final RefundRepository refundRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public RefundServiceImpl(RefundRepository refundRepository, UserRepository userRepository, AuditLogService auditLogService) {
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> list(String status, Boolean overLimit) {
        return refundRepository.findAllByOrderByRequestedAtDesc().stream()
                .filter(r -> status == null || status.isBlank() || "all".equalsIgnoreCase(status)
                        || r.getStatus().name().equalsIgnoreCase(status))
                .filter(r -> overLimit == null || (r.getAmount().compareTo(AUTO_APPROVE_LIMIT) >= 0) == overLimit)
                .map(RefundResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public RefundResponse approve(UUID id, String note, String actorEmail) {
        Refund refund = getPendingOrThrow(id);

        boolean overLimit = refund.getAmount().compareTo(AUTO_APPROVE_LIMIT) >= 0;
        if (overLimit && (note == null || note.isBlank())) {
            throw new RefundNoteRequiredException("A justification is required for over-limit approvals.");
        }

        String actorLabel = resolveActorLabel(actorEmail);

        refund.setStatus(RefundStatus.APPROVED);
        refund.setNote(note == null ? "" : note.trim());
        refund.setDecidedBy(actorLabel);
        refund.setDecidedAt(Instant.now());
        Refund saved = refundRepository.save(refund);

        auditLogService.record(
                "refund_approved",
                actorLabel,
                saved.getCode() + " · " + saved.getCustomerName(),
                "Approved " + saved.getAmount() + " - " + (saved.getNote().isBlank() ? "no note provided." : saved.getNote())
        );

        return RefundResponse.from(saved);
    }

    @Override
    @Transactional
    public RefundResponse reject(UUID id, String note, String actorEmail) {
        Refund refund = getPendingOrThrow(id);

        if (note == null || note.isBlank()) {
            throw new RefundNoteRequiredException("A reason is required to reject a request.");
        }

        String actorLabel = resolveActorLabel(actorEmail);

        refund.setStatus(RefundStatus.REJECTED);
        refund.setNote(note.trim());
        refund.setDecidedBy(actorLabel);
        refund.setDecidedAt(Instant.now());
        Refund saved = refundRepository.save(refund);

        auditLogService.record(
                "refund_rejected",
                actorLabel,
                saved.getCode() + " · " + saved.getCustomerName(),
                "Rejected " + saved.getAmount() + " - " + saved.getNote()
        );

        return RefundResponse.from(saved);
    }

    private Refund getPendingOrThrow(UUID id) {
        Refund refund = refundRepository.findById(id)
                .orElseThrow(() -> RefundNotFoundException.forId(id));
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new InvalidRefundStateException(
                    "This refund has already been decided (" + refund.getStatus().name().toLowerCase() + ").");
        }
        return refund;
    }

    private String resolveActorLabel(String actorEmail) {
        return userRepository.findByEmail(actorEmail)
                .map(User::getName)
                .map(name -> name + " (ADMIN)")
                .orElse(actorEmail);
    }
}
