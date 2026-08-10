import React, { Fragment, useCallback, useEffect, useState } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import * as api from "../../lib/api.js";

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
   trouble without digging through raw logs. This page is read-only, like
   the audit trail.

   Backend contract (Spring) — implemented, see MetricsController/MetricsService:
     GET /api/metrics/summary
       -> { ticketsOpen, ticketsResolvedToday, avgResolutionMins,
            escalationRatePercent, ticketsByPriority: [{label,count}],
            toolCallsByType: [{label,count}], notes: [...] }

   Two differences from the original mock/design intent, both because the
   underlying feature doesn't exist in this codebase yet (not something this
   page can fix on its own):
     - "Tickets by category" is now "Tickets by priority" - Ticket has no
       category column (that needs Epic J's ticket classification).
     - "Tool-call volume by type" has no real data source yet (needs Epic
       H's AI tool-calling loop) - shown as an explicit empty state instead
       of fabricated numbers, with the backend's `notes` surfaced so nobody
       mistakes "no data" for "no problems".
   ============================================================ */

function BarList({ title, icon, data, emptyMessage }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 20, flex: 1, minWidth: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Icon name={icon} size={16} color={COLORS.grey} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>{title}</div>
      </div>
      {data.length === 0 ? (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.greyDim }}>{emptyMessage}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.map(d => (
            <div key={d.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontFamily: FONT, fontSize: 12.5 }}>
                <span style={{ color: COLORS.white, fontWeight: 600 }}>{d.label}</span>
                <span style={{ color: COLORS.grey, fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
              </div>
              <div style={{ height: 8, borderRadius: 5, background: COLORS.ink, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(d.count / max) * 100}%`, background: d.color, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRIORITY_COLOR = { LOW: COLORS.grey, MEDIUM: COLORS.blue, HIGH: COLORS.yellow, URGENT: COLORS.red };

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function MetricsPage({ auth: authProp, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);
  const { token } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const canLoad = Boolean(auth) && role === "ADMIN" && Boolean(token);

  const loadSummary = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.getMetricsSummary(token);
      setSummary(data);
    } catch (err) {
      setLoadError(err.message || "Could not load metrics.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const ticketsByPriority = (summary?.ticketsByPriority || [])
    .filter(d => d.count > 0)
    .map(d => ({ label: d.label, count: d.count, color: PRIORITY_COLOR[d.label] || COLORS.grey }));

  const toolCallsByType = (summary?.toolCallsByType || [])
    .map(d => ({ label: d.label, count: d.count, color: COLORS.blue }));

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
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>Loading metrics…</div>
      ) : loadError ? (
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px" }}>
          <div style={{ padding: 12, border: `1px solid ${COLORS.red}`, borderRadius: 10, color: COLORS.red, fontFamily: FONT, fontSize: 13 }}>
            {loadError}
          </div>
        </div>
      ) : (
        <Fragment>
          <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }}>
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
              <StatChip label="Open tickets" value={summary.ticketsOpen} />
              <StatDivider /><StatChip label="Resolved today" value={summary.ticketsResolvedToday} color={COLORS.green} />
              <StatDivider /><StatChip label="Avg resolution (min)" value={summary.avgResolutionMins.toFixed(1)} />
              <StatDivider /><StatChip label="Escalation rate" value={`${summary.escalationRatePercent.toFixed(1)}%`} color={COLORS.yellow} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px", display: "flex", gap: 20, flexWrap: "wrap" }}>
            <BarList
              title="Tickets by priority (all time)"
              icon="barChart"
              data={ticketsByPriority}
              emptyMessage="No tickets yet."
            />
            <BarList
              title="Tool-call volume by type"
              icon="shield"
              data={toolCallsByType}
              emptyMessage="Not available yet — the AI assistant's tool-calling loop (Epic H) isn't implemented, so there's nothing to count."
            />
          </div>

          {summary.notes && summary.notes.length > 0 && (
            <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 28px 28px" }}>
              <div style={{ fontFamily: FONT, fontSize: 11.5, color: COLORS.greyDim, lineHeight: 1.6 }}>
                {summary.notes.map((n, i) => <div key={i}>· {n}</div>)}
              </div>
            </div>
          )}
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
