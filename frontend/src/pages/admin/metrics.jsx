import React, { Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";

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

   Story L2 — surface enough operational signal (ticket volume by
   category, tool-call volume by type, resolution time, escalation rate)
   for an admin to spot trouble without digging through raw logs. This
   page is read-only, like the audit trail.

   Bars are direct-labeled (name + count printed next to each bar) rather
   than relying on a legend or color alone to identify a category — the
   brand palette here is fixed for consistency, not chosen for charting,
   so color can't be the only way to tell categories apart.

   Backend contract (Spring):
     GET /api/metrics/summary?from=&to=
       -> { ticketsOpen, ticketsResolvedToday, avgResolutionMins,
            escalationRate, ticketsByCategory: [{label,count}],
            toolCallsByType: [{label,count}] }
   MOCK_MODE seeds local data so this page runs without a backend.
   ============================================================ */

const TICKETS_BY_CATEGORY = [
  { label: "Shipping delay", count: 132, color: COLORS.blue },
  { label: "Refund request", count: 98, color: COLORS.red },
  { label: "Account access", count: 74, color: COLORS.green },
  { label: "Product defect", count: 51, color: COLORS.yellow },
  { label: "Billing question", count: 39, color: COLORS.grey },
];

const TOOL_CALLS_BY_TYPE = [
  { label: "kb_search", count: 410, color: COLORS.blue },
  { label: "order_lookup", count: 265, color: COLORS.green },
  { label: "refund_propose", count: 87, color: COLORS.red },
  { label: "ticket_escalate", count: 33, color: COLORS.yellow },
];

const SUMMARY = {
  ticketsOpen: 46,
  ticketsResolvedToday: 61,
  avgResolutionMins: 14.2,
  escalationRate: 7.8,
};

function BarList({ title, icon, data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 20, flex: 1, minWidth: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Icon name={icon} size={16} color={COLORS.grey} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>{title}</div>
      </div>
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
    </div>
  );
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function MetricsPage({ auth: authProp, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

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
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
              <StatChip label="Open tickets" value={SUMMARY.ticketsOpen} />
              <StatDivider /><StatChip label="Resolved today" value={SUMMARY.ticketsResolvedToday} color={COLORS.green} />
              <StatDivider /><StatChip label="Avg resolution (min)" value={SUMMARY.avgResolutionMins} />
              <StatDivider /><StatChip label="Escalation rate" value={`${SUMMARY.escalationRate}%`} color={COLORS.yellow} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px", display: "flex", gap: 20, flexWrap: "wrap" }}>
            <BarList title="Tickets by category (last 30 days)" icon="barChart" data={TICKETS_BY_CATEGORY} />
            <BarList title="Tool-call volume by type (last 30 days)" icon="shield" data={TOOL_CALLS_BY_TYPE} />
          </div>
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
