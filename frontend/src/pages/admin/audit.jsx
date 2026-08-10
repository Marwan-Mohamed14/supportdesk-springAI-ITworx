import React, { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/api.js";

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

   Backend contract (Spring) — implemented, see AuditController/AuditService:
     GET /api/audit?q=&action=&actor=&from=&to=
   Real entries are written server-side by whichever endpoint performed the
   action - today that's KbArticleService (kb_created/kb_updated/kb_ingested)
   and RefundService (refund_requested/refund_approved/refund_rejected). This
   page does not write audit rows itself, it only reads them. "login" and
   "ticket_escalated" entries aren't produced by anything yet - those need
   login-time auditing and TicketService wiring that are outside this epic's
   scope - so those ACTION_META entries stay unused for now rather than
   fabricating fake activity.
   ============================================================ */

const ACTION_META = {
  refund_requested: { label: "Refund requested", color: COLORS.blue, icon: "creditCard" },
  refund_approved: { label: "Refund approved", color: COLORS.green, icon: "checkCircle" },
  refund_rejected: { label: "Refund rejected", color: COLORS.red, icon: "xCircle" },
  kb_created: { label: "KB article created", color: COLORS.blue, icon: "bookOpen" },
  kb_updated: { label: "KB article updated", color: COLORS.blue, icon: "pencil" },
  kb_ingested: { label: "KB re-ingested", color: COLORS.greyDim, icon: "refreshCw" },
  login: { label: "Signed in", color: COLORS.greyDim, icon: "lock" },
  ticket_escalated: { label: "Ticket escalated", color: COLORS.yellow, icon: "alertTriangle" },
};

function fromApi(e) {
  return {
    id: e.id,
    timestamp: e.timestamp ? e.timestamp.slice(0, 16).replace("T", " ") : "",
    actor: e.actor || "—",
    action: e.action,
    target: e.target || "—",
    detail: e.detail || "",
  };
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
  const { token } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const canLoad = Boolean(auth) && role === "ADMIN" && Boolean(token);

  const loadEntries = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setLoadError("");
    try {
      const page = await api.listAudit(token, {
        q: query || undefined,
        action: action !== "all" ? action : undefined,
      });
      setEntries((page.content || []).map(fromApi));
    } catch (err) {
      setLoadError(err.message || "Could not load the audit trail.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, token, query, action]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filtered = entries; // filtering happens server-side via loadEntries' query params

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

            {loadError && (
              <div style={{ marginBottom: 16, padding: 12, border: `1px solid ${COLORS.red}`, borderRadius: 10, color: COLORS.red, fontFamily: FONT, fontSize: 13 }}>
                {loadError}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "70px 0", color: COLORS.grey, fontFamily: FONT }}>Loading audit trail…</div>
            ) : filtered.length === 0 ? (
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
