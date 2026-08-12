package com.itworx.supportdesk.dto;

/**
 * Body for both POST /api/refunds/{id}/approve and .../reject.
 * `note` is optional for a normal approval, but RefundServiceImpl requires
 * it (400 via RefundNoteRequiredException) for rejections and for
 * over-limit approvals (story H5).
 */
public record RefundDecisionRequest(String note) {
}
