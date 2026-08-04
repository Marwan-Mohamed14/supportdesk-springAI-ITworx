import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminData } from "./AdminDataContext";
import { money } from "./mockData";

// Refund Approvals — story H5 (human-in-the-loop refunds).
//
// TODO when wiring to the real backend: the assistant's issueRefund tool
// returns a pending-confirmation result (never a completed refund). This
// page is that confirmation step — POST the decision to whatever endpoint
// turns a pending refund into approved/rejected. The audit entry (story K4)
// this currently writes into AdminDataContext should instead just be
// whatever the backend's audit endpoint records for that call.
export default function Refunds({ onNavigate = () => {} }) {
  const { refundQueue: queue, refundHistory: history, decideRefund } = useAdminData();
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  const pending = queue.filter((r) => r.status === "pending");

  const flash = (msg) => {
    setToast(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast(null), 3200);
  };

  const decide = (id, decision, reasonText) => {
    const r = queue.find((x) => x.id === id);
    if (!r) return;
    decideRefund(id, decision, reasonText);
    flash(`${decision === "approved" ? "Approved" : "Rejected"} refund for ${r.order}.`);
  };

  return (
    <AdminLayout
      active="refunds"
      title="Refund Approvals"
      subtitle="Assistant-proposed refunds require admin sign-off before funds move — story H5"
      pendingRefundCount={pending.length}
      onNavigate={onNavigate}
    >
      <div className="a-card">
        <div className="a-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Requested</th>
                <th>Order total</th>
                <th>Reason</th>
                <th>Conversation</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="a-muted">
                    No pending refund requests.
                  </td>
                </tr>
              ) : (
                pending.map((r) => {
                  const overLimit = r.requested > r.orderTotal;
                  return (
                    <React.Fragment key={r.id}>
                      <tr>
                        <td className="a-cell-strong">{r.order}</td>
                        <td>{r.customer}</td>
                        <td style={{ color: overLimit ? "var(--admin-red)" : "var(--admin-white)", fontWeight: 600 }}>
                          {money(r.requested)} {overLimit ? "⚠" : ""}
                        </td>
                        <td className="a-muted">{money(r.orderTotal)}</td>
                        <td className="a-muted">{r.reason}</td>
                        <td className="a-muted">{r.conversation}</td>
                        <td>
                          <span className="a-chip a-chip-pending">Pending</span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            className="a-btn a-btn-approve a-btn-sm"
                            disabled={overLimit}
                            title={overLimit ? "Exceeds order total — cannot approve as-is" : undefined}
                            onClick={() => decide(r.id, "approved")}
                          >
                            Approve
                          </button>{" "}
                          <button
                            className="a-btn a-btn-reject a-btn-sm"
                            onClick={() => {
                              setRejectingId(r.id);
                              setReason("");
                            }}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                      {overLimit && (
                        <tr>
                          <td></td>
                          <td colSpan={7} className="a-warn-text">
                            Requested amount exceeds the order total — per story H5 this must be
                            rejected or corrected, not approved as-is.
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-title-row">
          <h2>Recently decided</h2>
        </div>
        <div className="a-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Decision</th>
                <th>By</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="a-cell-strong">{h.order}</td>
                  <td>{h.customer}</td>
                  <td>{money(h.amount)}</td>
                  <td>
                    {h.decision === "approved" ? (
                      <span className="a-chip a-chip-approved">Approved</span>
                    ) : (
                      <span className="a-chip a-chip-rejected">Rejected</span>
                    )}
                  </td>
                  <td className="a-muted">{h.by}</td>
                  <td className="a-muted">{h.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingId && (
        <div className="a-modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="a-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reject refund</h2>
            <div className="a-modal-sub">This is recorded in the audit log with your reasoning.</div>
            <div className="a-field">
              <label>Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Amount exceeds order total"
              />
            </div>
            <div className="a-modal-actions">
              <button className="a-btn a-btn-ghost" onClick={() => setRejectingId(null)}>
                Cancel
              </button>
              <button
                className="a-btn a-btn-reject"
                onClick={() => {
                  decide(rejectingId, "rejected", reason.trim());
                  setRejectingId(null);
                }}
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="a-toast">{toast}</div>}
    </AdminLayout>
  );
}
