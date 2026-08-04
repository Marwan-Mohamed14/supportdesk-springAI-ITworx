import React, { useState, useMemo, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  Modal, fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate, money,
} from "./admin-shared.jsx";

/* ============================================================
   Epic H — Refund Approvals (human-in-the-loop, over-limit guard)
   ------------------------------------------------------------
   Scoped to just this epic on purpose, same as pages/products/catalog.jsx:
     - No app shell / router / nav here — a page component, meant to be
       routed to from a shared App.jsx once the frontend project is
       scaffolded.
     - Auth is NOT reimplemented here. Accepts the logged-in user via the
       `auth` prop: auth = { displayName, role: "AGENT"|"ADMIN", expiresAt }
       and calls `onSignOut()` on sign-out. Falls back to a local demo
       login (admin-only) so this page works standalone in `npm run dev`
       before Epic A is wired in. Delete the fallback once real auth exists.
     - Admin-only: there is no agent-facing view of this page (story A2).

   Story H5 — the AI assistant can PROPOSE a refund, but anything at or
   above the auto-approve limit must stop and wait for an explicit human
   decision before the tool actually executes. This page is that human
   checkpoint: every request below the limit still needs a click, and
   every request at/above the limit is flagged and additionally requires
   the admin to type a short justification before Approve is enabled.

   Backend contract (Spring):
     GET   /api/refunds?status=&overLimit=
     POST  /api/refunds/{id}/approve   body: {note?}
     POST  /api/refunds/{id}/reject    body: {note}   (note required)
   Every approve/reject here should also produce an Audit Trail entry
   (Epic K) — that write happens server-side once real endpoints exist;
   this page does not talk to the audit page directly (pages stay
   independent per this project's convention, see catalog.jsx).
   MOCK_MODE seeds local data so this page runs without a backend.
   ============================================================ */

const AUTO_APPROVE_LIMIT = 200;

function seedRequests() {
  return [
    { id: "RF-1001", orderId: "ORD-58291", customer: "Nadia Fathy", amount: 42.5, reason: "Item arrived damaged", requestedBy: "AI Assistant", requestedAt: "2026-08-03 14:12", status: "pending", note: "" },
    { id: "RF-1002", orderId: "ORD-58305", customer: "Omar Adel", amount: 315.0, reason: "Order never delivered — carrier lost package", requestedBy: "AI Assistant", requestedAt: "2026-08-03 16:40", status: "pending", note: "" },
    { id: "RF-1003", orderId: "ORD-58260", customer: "Lina Sabry", amount: 18.99, reason: "Duplicate charge", requestedBy: "AI Assistant", requestedAt: "2026-08-02 09:05", status: "approved", note: "Confirmed duplicate in billing system." },
    { id: "RF-1004", orderId: "ORD-58198", customer: "Youssef Amin", amount: 610.0, reason: "Customer cancelled within window, high-value electronics", requestedBy: "AI Assistant", requestedAt: "2026-08-01 11:22", status: "rejected", note: "Cancellation window had already closed; escalated to billing instead." },
    { id: "RF-1005", orderId: "ORD-58312", customer: "Mona Kamal", amount: 75.25, reason: "Wrong item shipped", requestedBy: "AI Assistant", requestedAt: "2026-08-04 08:50", status: "pending", note: "" },
  ];
}

function RequestDetail({ request }) {
  const overLimit = request.amount >= AUTO_APPROVE_LIMIT;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: COLORS.grey }}>Order</span>
        <span style={{ color: COLORS.white, fontWeight: 600 }}>{request.orderId}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: COLORS.grey }}>Customer</span>
        <span style={{ color: COLORS.white, fontWeight: 600 }}>{request.customer}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: COLORS.grey }}>Amount</span>
        <span style={{ color: overLimit ? COLORS.yellow : COLORS.white, fontWeight: 700 }}>{money(request.amount)}</span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 13, color: COLORS.grey }}>
        Reason: <span style={{ color: COLORS.white }}>{request.reason}</span>
      </div>
      {overLimit && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(248,206,70,0.08)", border: `1px solid ${COLORS.yellow}`, borderRadius: 10, padding: 12 }}>
          <Icon name="alertTriangle" size={16} color={COLORS.yellow} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.white, lineHeight: 1.5 }}>
            This request is at or above the auto-approve limit ({money(AUTO_APPROVE_LIMIT)}). Story H5 requires a
            written justification before this can be approved.
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionForm({ request, mode, onSubmit, onCancel }) {
  const overLimit = request.amount >= AUTO_APPROVE_LIMIT;
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const noteRequired = mode === "reject" || overLimit;
  const submit = () => {
    if (noteRequired && !note.trim()) {
      setErr(mode === "reject" ? "A reason is required to reject a request." : "A justification is required for over-limit approvals.");
      return;
    }
    setErr("");
    onSubmit(note.trim());
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        {fieldLabel(mode === "reject" ? "Reason for rejection (required)" : overLimit ? "Justification (required — over limit)" : "Note (optional)")}
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: FONT }} value={note} onChange={e => setNote(e.target.value)}
          placeholder={mode === "reject" ? "e.g. Return window had already closed…" : "e.g. Verified with carrier — package confirmed lost…"} />
      </div>
      {err && <div style={{ fontSize: 12.5, color: COLORS.red, fontFamily: FONT }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onCancel} style={{ flex: 1, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
        <button onClick={submit} style={{
          flex: 1, border: "none", borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer",
          background: mode === "reject" ? COLORS.red : COLORS.green, color: mode === "reject" ? COLORS.white : COLORS.ink,
        }}>
          {mode === "reject" ? "Reject request" : "Approve refund"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function RefundApprovalsPage({ auth: authProp, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [requests, setRequests] = useState(seedRequests);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [modal, setModal] = useState(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "pending");
    return {
      pending: pending.length,
      overLimitPending: pending.filter(r => r.amount >= AUTO_APPROVE_LIMIT).length,
      approvedTotal: requests.filter(r => r.status === "approved").reduce((s, r) => s + r.amount, 0),
      rejected: requests.filter(r => r.status === "rejected").length,
    };
  }, [requests]);

  const decide = (id, decision, note) => {
    const r = requests.find(x => x.id === id);
    setRequests(list => list.map(x => x.id === id ? { ...x, status: decision, note } : x));
    setModal(null);
    if (decision === "approved") {
      pushToast(`Approved ${money(r.amount)} refund for ${r.customer} (${r.id}).`);
    } else {
      pushToast(`Rejected refund ${r.id} for ${r.customer}.`, "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AdminPageHeader title="Refund Approvals" epic="Epic H" auth={auth} usingDemoAuth={usingDemoAuth} now={now} onSignOut={handleSignOut} />

      {!auth ? (
        usingDemoAuth ? <DemoLoginPanel onLogin={setDemoAuth} requireAdmin /> : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>Not signed in.</div>
        )
      ) : role !== "ADMIN" ? (
        <AdminOnlyGate role={role} />
      ) : (
        <Fragment>
          <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }}>
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
              <StatChip label="Pending" value={stats.pending} color={stats.pending ? COLORS.yellow : COLORS.white} />
              <StatDivider /><StatChip label="Over-limit pending" value={stats.overLimitPending} color={stats.overLimitPending ? COLORS.red : COLORS.white} />
              <StatDivider /><StatChip label="Approved (total)" value={money(stats.approvedTotal)} color={COLORS.green} />
              <StatDivider /><StatChip label="Rejected" value={stats.rejected} color={COLORS.greyDim} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: FONT, fontSize: 13, color: COLORS.grey }}>
                Requests at or above <span style={{ color: COLORS.yellow, fontWeight: 700 }}>{money(AUTO_APPROVE_LIMIT)}</span> require a written justification (story H5).
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
                <Icon name="creditCard" size={26} color={COLORS.greyDim} />
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>No refund requests match this filter.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(r => {
                  const overLimit = r.amount >= AUTO_APPROVE_LIMIT;
                  return (
                    <div key={r.id} style={{ background: COLORS.panel, border: `1px solid ${overLimit && r.status === "pending" ? COLORS.yellow : COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <Icon name="creditCard" size={18} color={COLORS.grey} />
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: COLORS.white, display: "flex", alignItems: "center", gap: 8 }}>
                          {r.id} <span style={{ color: COLORS.grey, fontWeight: 400 }}>· {r.customer}</span>
                          {overLimit && <Icon name="alertTriangle" size={13} color={COLORS.yellow} />}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.grey, marginTop: 3 }}>{r.orderId} · {r.reason}</div>
                      </div>
                      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: overLimit ? COLORS.yellow : COLORS.white, minWidth: 90, textAlign: "right" }}>
                        {money(r.amount)}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 11.5, color: COLORS.greyDim, minWidth: 130 }}>
                        {r.requestedBy} · {r.requestedAt}
                      </div>
                      {r.status === "pending" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setModal({ request: r, mode: "reject" })} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.red, borderRadius: 8, padding: "7px 12px", fontFamily: FONT, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                            <Icon name="xCircle" size={13} /> Reject
                          </button>
                          <button onClick={() => setModal({ request: r, mode: "approve" })} style={{ display: "flex", alignItems: "center", gap: 5, background: COLORS.green, border: "none", color: COLORS.ink, borderRadius: 8, padding: "7px 12px", fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                            <Icon name="checkCircle" size={13} /> Approve
                          </button>
                        </div>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: r.status === "approved" ? COLORS.green : COLORS.greyDim, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "5px 11px" }}>
                          <Icon name={r.status === "approved" ? "checkCircle" : "xCircle"} size={12} color={r.status === "approved" ? COLORS.green : COLORS.greyDim} /> {r.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {modal && (
            <Modal title={modal.mode === "reject" ? "Reject refund request" : "Approve refund request"} onClose={() => setModal(null)}>
              <RequestDetail request={modal.request} />
              <DecisionForm
                request={modal.request}
                mode={modal.mode}
                onCancel={() => setModal(null)}
                onSubmit={(note) => decide(modal.request.id, modal.mode === "reject" ? "rejected" : "approved", note)}
              />
            </Modal>
          )}
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
