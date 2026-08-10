package com.itworx.supportdesk.service.refund;

import com.itworx.supportdesk.dto.refund.CreateRefundRequest;
import com.itworx.supportdesk.dto.refund.RefundDecisionRequest;
import com.itworx.supportdesk.dto.refund.RefundResponse;
import com.itworx.supportdesk.exception.InvalidRefundStateException;
import com.itworx.supportdesk.exception.OrderNotFoundException;
import com.itworx.supportdesk.exception.RefundNotFoundException;
import com.itworx.supportdesk.model.User;
import com.itworx.supportdesk.model.order.Order;
import com.itworx.supportdesk.model.refund.Refund;
import com.itworx.supportdesk.model.refund.RefundStatus;
import com.itworx.supportdesk.repository.OrderRepository;
import com.itworx.supportdesk.repository.RefundRepository;
import com.itworx.supportdesk.service.audit.AuditService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Epic H, story H5 - human-in-the-loop refund approval. See Refund.java for
 * what's deliberately out of scope (the AI assistant calling this
 * automatically needs Epic H's tool-calling loop, which doesn't exist yet).
 */
@Service
public class RefundService {

    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final AuditService auditService;
    private final BigDecimal autoApproveLimit;

    public RefundService(
            RefundRepository refundRepository,
            OrderRepository orderRepository,
            AuditService auditService,
            @Value("${app.refunds.auto-approve-limit:200}") BigDecimal autoApproveLimit
    ) {
        this.refundRepository = refundRepository;
        this.orderRepository = orderRepository;
        this.auditService = auditService;
        this.autoApproveLimit = autoApproveLimit;
    }

    @Transactional
    public RefundResponse create(CreateRefundRequest request, User requester) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new OrderNotFoundException(request.orderId()));

        // H5: an assistant/agent can propose more than the order is worth by
        // mistake - reject it outright rather than let an admin approve it.
        if (request.amount().compareTo(order.getTotalAmount()) > 0) {
            throw new InvalidRefundStateException(
                    "Requested amount (" + request.amount() + ") exceeds the order total (" + order.getTotalAmount() + ")");
        }

        Refund refund = new Refund(generateRefundNumber(), order, request.amount(), request.reason(), requester);
        Refund saved = refundRepository.save(refund);

        auditService.record(requester, "refund_requested",
                saved.getRefundNumber() + " · " + saved.getAmount(),
                "Refund requested - pending admin approval.");

        return RefundResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<RefundResponse> search(RefundStatus status, boolean overLimitOnly, Pageable pageable) {
        BigDecimal overLimitAmount = overLimitOnly ? autoApproveLimit : null;
        return refundRepository.search(status, overLimitAmount, pageable).map(RefundResponse::from);
    }

    @Transactional
    public RefundResponse approve(UUID id, RefundDecisionRequest request, User actor) {
        Refund refund = findOrThrow(id);
        requirePending(refund);

        boolean overLimit = refund.getAmount().compareTo(autoApproveLimit) >= 0;
        String note = request.note() != null ? request.note().trim() : "";
        if (overLimit && note.isEmpty()) {
            throw new InvalidRefundStateException(
                    "A written justification is required to approve a refund at or above " + autoApproveLimit + ".");
        }

        refund.setStatus(RefundStatus.APPROVED);
        refund.setNote(note.isEmpty() ? null : note);
        refund.setDecidedBy(actor);
        refund.setDecidedAt(Instant.now());
        Refund saved = refundRepository.save(refund);

        auditService.record(actor, "refund_approved",
                saved.getOrder().getOrderNumber() + " · " + saved.getAmount(),
                "Approved" + (saved.getNote() != null ? " — " + saved.getNote() : "."));

        return RefundResponse.from(saved);
    }

    @Transactional
    public RefundResponse reject(UUID id, RefundDecisionRequest request, User actor) {
        Refund refund = findOrThrow(id);
        requirePending(refund);

        String note = request.note() != null ? request.note().trim() : "";
        if (note.isEmpty()) {
            throw new InvalidRefundStateException("A reason is required to reject a refund request.");
        }

        refund.setStatus(RefundStatus.REJECTED);
        refund.setNote(note);
        refund.setDecidedBy(actor);
        refund.setDecidedAt(Instant.now());
        Refund saved = refundRepository.save(refund);

        auditService.record(actor, "refund_rejected",
                saved.getOrder().getOrderNumber() + " · " + saved.getAmount(),
                "Rejected — " + note);

        return RefundResponse.from(saved);
    }

    private void requirePending(Refund refund) {
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new InvalidRefundStateException(
                    "Refund " + refund.getRefundNumber() + " has already been " + refund.getStatus().name().toLowerCase() + ".");
        }
    }

    private Refund findOrThrow(UUID id) {
        return refundRepository.findById(id)
                .orElseThrow(() -> new RefundNotFoundException(id));
    }

    private String generateRefundNumber() {
        String candidate;
        do {
            candidate = "RF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (refundRepository.existsByRefundNumber(candidate));
        return candidate;
    }
}
