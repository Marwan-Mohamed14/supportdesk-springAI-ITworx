package com.itworx.supportdesk.dto.refund;

/**
 * Body for both POST /api/refunds/{id}/approve and POST /api/refunds/{id}/reject.
 * note is optional for an under-limit approval, but RefundService enforces it
 * as required for a reject or an at/above-limit approval (story H5) - the
 * DTO itself stays permissive so one shape covers both endpoints.
 */
public record RefundDecisionRequest(
        String note
) {
}
