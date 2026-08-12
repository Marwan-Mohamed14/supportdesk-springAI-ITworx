import React, { Fragment, useCallback, useEffect, useState } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";
import { getMetricsSummary } from "../../lib/api.js";

/* ============================================================
   Epic L — Operational Metrics
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

   Story L2 — surface enough operational signal for an admin to spot
   trouble without digging through raw logs. This page is read-only,
   like the audit trail.

   Backed by the real backend: GET /api/metrics/summary (ADMIN only,
   see SecurityConfig). `token` is supplied by withAdminAuth alongside
   `auth` — the demo login fallback above has no real token, so it
   shows an explanatory message instead of a confusing fetch failure.

   Only ticketsOpen / ticketsResolvedToday / avgResolutionMins /
   escalationRate are real — see MetricsService for exactly how each is
   computed from the tickets table. "Tickets by category" and "tool-call
   volume by type" from the original mockup are NOT shown as numbers:
   tickets have no category field, and no tool-call is logged anywhere
   in the backend, so there is nothing real to show yet. Below is an
   honest placeholder instead of invented data — swap it out once a
   category field + tool-call logging exist server-side.
   ============================================================ */

function NotAvailableCard({ title, icon, reason }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px dashed ${COLORS.line}`, borderRadius: 16, padding: 20, flex: 1, minWidth: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon name={icon} size={16} color={COLORS.greyDim} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>{title}</div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.greyDim, lineHeight: 1.5 }}>
        Not available yet — {reason}
      </div>
    </div>
  );
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
     token     — real JWT, supplied by withAdminAuth; absent when using
                 the demo-login fallback below.
   ============================================================ */
export default function MetricsPage({ auth: authProp, onSignOut, token }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setSummary(null);
      setError("This demo login has no real backend session — sign in through the actual app to see live metrics.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getMetricsSummary(token);
      setSummary(data);
      setError(null);
    } catch (err) {
      setSummary(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (auth && role === "ADMIN") load();
  }, [auth, role, load]);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AdminPageHeader title="Metrics" epic="Epic L" auth={auth} usingDemoAuth={usingDemoAuth} now={now} onSignOut={handleSignOut} />

      {!auth ? (
        usingDemoAuth ? <DemoLoginPanel onLogin={setDemoAuth} requireAdmin /> : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>Not signed in.</div>
        )
      ) : role !== "ADMIN" ? (
        <AdminOnlyGate role={role} />
      ) : (
        <Fragment>
          <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }}>
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex" }}>
                <StatChip label="Open tickets" value={loading ? "…" : summary ? summary.ticketsOpen : "—"} />
                <StatDivider /><StatChip label="Resolved today" value={loading ? "…" : summary ? summary.ticketsResolvedToday : "—"} color={COLORS.green} />
                <StatDivider /><StatChip label="Avg resolution (min)" value={loading ? "…" : summary?.avgResolutionMins != null ? summary.avgResolutionMins : (summary ? "n/a — no closed tickets" : "—")} />
                <StatDivider /><StatChip label="Escalation rate" value={loading ? "…" : summary ? `${summary.escalationRate}%` : "—"} color={COLORS.yellow} />
              </div>
              <button onClick={load} disabled={loading || !token} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "8px 14px", fontFamily: FONT, fontSize: 12.5, cursor: loading || !token ? "default" : "pointer", opacity: loading || !token ? 0.6 : 1 }}>
                <Icon name="refreshCw" size={13} /> {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ maxWidth: 1320, margin: "16px auto 0", padding: "0 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", fontFamily: FONT, fontSize: 13 }}>
                <span>{token ? `Couldn't load metrics — ${error}` : error}</span>
                {token && (
                  <button onClick={load} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.white, borderRadius: 8, padding: "6px 12px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px", display: "flex", gap: 20, flexWrap: "wrap" }}>
            <NotAvailableCard
              title="Tickets by category"
              icon="barChart"
              reason="tickets don't have a category field in the database yet. Needs a backend schema change (add a category column to tickets) before this can be real."
            />
            <NotAvailableCard
              title="Tool-call volume by type"
              icon="shield"
              reason="no tool call the AI assistant makes is logged anywhere in the backend yet. Needs a tool-call log table plus instrumentation in the chatbot's tool layer before this can be real."
            />
          </div>
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
