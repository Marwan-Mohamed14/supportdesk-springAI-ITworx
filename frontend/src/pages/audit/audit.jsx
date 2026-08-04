import React, { useState, useMemo, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate,
} from "../admin-shared.jsx";

/* ============================================================
   Epic K — Audit Trail
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

   Story K4 — every tool action the assistant (or an admin) takes against
   a customer's data must be recorded and reviewable: who/what did it,
   when, on which target, and the outcome. This page is strictly
   read-only — it never mutates anything, it just displays what the
   backend already recorded.

   Backend contract (Spring):
     GET /api/audit?q=&action=&actor=&from=&to=
   Real entries are written server-side by whichever endpoint performed
   the action (refund approve/reject, KB create/edit/ingest, etc.) — this
   page does not write audit rows itself, it only reads them.
   MOCK_MODE seeds local data so this page runs without a backend.
   ============================================================ */

const ACTION_META = {
  refund_approved: { label: "Refund approved", color: COLORS.green, icon: "checkCircle" },
  refund_rejected: { label: "Refund rejected", color: COLORS.red, icon: "xCircle" },
  kb_created: { label: "KB article created", color: COLORS.blue, icon: "bookOpen" },
  kb_updated: { label: "KB article updated", color: COLORS.blue, icon: "pencil" },
  kb_ingested: { label: "KB re-ingested", color: COLORS.greyDim, icon: "refreshCw" },
  login: { label: "Signed in", color: COLORS.greyDim, icon: "lock" },
  ticket_escalated: { label: "Ticket escalated", color: COLORS.yellow, icon: "alertTriangle" },
};

function seedEntries() {
  return [
    { id: "AU-3001", timestamp: "2026-08-04 09:02", actor: "Karim (ADMIN)", action: "refund_approved", target: "RF-1003 · Lina Sabry", detail: "Approved $18.99 — confirmed duplicate in billing system." },
    { id: "AU-3002", timestamp: "2026-08-04 08:55", actor: "AI Assistant", action: "ticket_escalated", target: "TCK-7742", detail: "Escalated to human agent — customer requested manager." },
    { id: "AU-3003", timestamp: "2026-08-03 17:10", actor: "Karim (ADMIN)", action: "refund_rejected", target: "RF-1004 · Youssef Amin", detail: "Rejected $610.00 — cancellation window had closed." },
    { id: "AU-3004", timestamp: "2026-08-03 15:40", actor: "Karim (ADMIN)", action: "kb_updated", target: "Warranty claims — storage devices", detail: "Edited body text, tags unchanged." },
    { id: "AU-3005", timestamp: "2026-08-03 15:41", actor: "Karim (ADMIN)", action: "kb_ingested", target: "Warranty claims — storage devices", detail: "Re-ingested after edit — old chunks replaced." },
    { id: "AU-3006", timestamp: "2026-08-02 11:05", actor: "Karim (ADMIN)", action: "login", target: "—", detail: "Signed in from admin console." },
    { id: "AU-3007", timestamp: "2026-08-01 13:22", actor: "Sara (AGENT)", action: "ticket_escalated", target: "TCK-7699", detail: "Escalated — needed refund above agent authority." },
    { id: "AU-3008", timestamp: "2026-07-30 10:12", actor: "Karim (ADMIN)", action: "kb_created", target: "Bulk order discount tiers", detail: "New article created as draft." },
  ];
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function AuditTrailPage({ auth: authProp, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [entries] = useState(seedEntries);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      const matchesQ = !q || e.target.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q);
      const matchesAction = action === "all" || e.action === action;
      return matchesQ && matchesAction;
    });
  }, [entries, query, action]);

  const stats = useMemo(() => ({
    total: entries.length,
    refundDecisions: entries.filter(e => e.action === "refund_approved" || e.action === "refund_rejected").length,
    kbChanges: entries.filter(e => e.action.startsWith("kb_")).length,
    escalations: entries.filter(e => e.action === "ticket_escalated").length,
  }), [entries]);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AdminPageHeader title="Audit Trail" epic="Epic K" auth={auth} usingDemoAuth={usingDemoAuth} now={now} onSignOut={handleSignOut} />

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
              <StatChip label="Total entries" value={stats.total} />
              <StatDivider /><StatChip label="Refund decisions" value={stats.refundDecisions} color={COLORS.green} />
              <StatDivider /><StatChip label="KB changes" value={stats.kbChanges} color={COLORS.blue} />
              <StatDivider /><StatChip label="Escalations" value={stats.escalations} color={COLORS.yellow} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 320 }}>
                <Icon name="search" size={15} color={COLORS.grey} style={{ position: "absolute", left: 10, top: 10 }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search actor, target, detail…" style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
              <select value={action} onChange={e => setAction(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                <option value="all">All actions</option>
                {Object.entries(ACTION_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
                <Icon name="shield" size={26} color={COLORS.greyDim} />
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>No audit entries match these filters.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(e => {
                  const meta = ACTION_META[e.action] || { label: e.action, color: COLORS.grey, icon: "shield" };
                  return (
                    <div key={e.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <Icon name={meta.icon} size={18} color={meta.color} style={{ marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: COLORS.white, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: meta.color }}>{meta.label}</span>
                          <span style={{ color: COLORS.grey, fontWeight: 400 }}>· {e.target}</span>
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey, marginTop: 4 }}>{e.detail}</div>
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 11.5, color: COLORS.greyDim, minWidth: 150, textAlign: "right" }}>
                        <div>{e.actor}</div>
                        <div>{e.timestamp}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
