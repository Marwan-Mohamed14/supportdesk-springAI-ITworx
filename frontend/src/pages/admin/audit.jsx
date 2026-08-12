import React, { useState, useEffect, useMemo, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";
import { listAuditEntries, ApiError } from "../../lib/api.js";

/* ============================================================
   Epic K — Audit Trail
   ------------------------------------------------------------
   Wired to the real backend now: GET /api/audit?q=&action=&actor=&from=&to=
   Real rows are written server-side by whichever endpoint performed the
   action (see AuditLogService.record(...)) — this page stays read-only,
   it never writes anything itself.

   IMPORTANT: only refund approve/reject write real rows today (see
   RefundServiceImpl). KB edits, ticket escalations, and logins aren't
   instrumented to call AuditLogService.record(...) yet, so you won't see
   those action types here until that's added as a follow-up — the list
   below will look sparse compared to the old 8-entry demo mock until then.
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

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     token     — bearer token, forwarded by withAdminAuth, used to call the
                 real /api/audit endpoint below.
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function AuditTrailPage({ auth: authProp, token, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError("");
    listAuditEntries(token)
      .then(data => setEntries(data ?? []))
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load audit entries."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(e => {
      const matchesQ = !q || (e.target || "").toLowerCase().includes(q) || (e.actor || "").toLowerCase().includes(q) || (e.detail || "").toLowerCase().includes(q);
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
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey, maxWidth: 560 }}>
                Only refund approvals/rejections write real entries so far — KB edits, logins, and
                escalations aren't wired up to log here yet.
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={load} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, cursor: loading ? "default" : "pointer" }}>
                  <Icon name="refreshCw" size={13} /> Refresh
                </button>
                <div style={{ position: "relative", minWidth: 220, maxWidth: 320 }}>
                  <Icon name="search" size={15} color={COLORS.grey} style={{ position: "absolute", left: 10, top: 10 }} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search actor, target, detail…" style={{ ...inputStyle, paddingLeft: 32 }} />
                </div>
                <select value={action} onChange={e => setAction(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">All actions</option>
                  {Object.entries(ACTION_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "rgba(239,83,80,0.08)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, color: COLORS.white }}>{error}</div>
                <button onClick={load} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.white, borderRadius: 8, padding: "6px 12px", fontFamily: FONT, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>Retry</button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "70px 0", color: COLORS.grey, fontFamily: FONT }}>Loading audit entries…</div>
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
                        <div>{formatDate(e.createdAt)}</div>
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
