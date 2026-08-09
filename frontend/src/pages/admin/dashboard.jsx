import React from "react";
import AdminLayout from "./AdminLayout";
import { useAdminData } from "./AdminDataContext";
import { money } from "./mockData";

// Admin overview — KPI tiles + "needs your attention" + quick links.
// `onNavigate(pageKey)` should be wired to your router; it's how the
// quick-action buttons and "Review" links jump to the other admin pages.
export default function Dashboard({ onNavigate = () => {} }) {
  const { kbArticles, refundQueue } = useAdminData();
  const pendingRefunds = refundQueue.filter((r) => r.status === "pending");
  const staleArticles = kbArticles.filter((a) => a.status === "stale");

  const attentionRows = [
    ...pendingRefunds.map((r) => ({
      type: "Refund",
      item: r.order,
      detail: `${r.customer} · ${money(r.requested)}`,
      age: "—",
      goto: "refunds",
    })),
    ...staleArticles.map((a) => ({
      type: "KB",
      item: a.title,
      detail: "Needs re-ingest",
      age: a.lastIngested,
      goto: "knowledge-base",
    })),
  ];

  return (
    <AdminLayout
      active="dashboard"
      title="Admin Dashboard"
      subtitle="Overview across catalog, knowledge base, tickets and AI assistant activity"
      pendingRefundCount={pendingRefunds.length}
      onNavigate={onNavigate}
    >
      <div className="a-stat-row">
        <div className="a-stat-tile">
          <div className="a-num red">{pendingRefunds.length}</div>
          <div className="a-label">Pending refunds</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num yellow">6</div>
          <div className="a-label">Low stock SKUs</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num blue">12</div>
          <div className="a-label">Open tickets</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num green">{kbArticles.length}</div>
          <div className="a-label">KB articles</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num">{staleArticles.length}</div>
          <div className="a-label">Stale KB articles</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num">128k</div>
          <div className="a-label">Tokens (7d)</div>
        </div>
      </div>

      <div className="a-grid-2">
        <div className="a-card">
          <div className="a-card-title-row">
            <h2>Needs your attention</h2>
          </div>
          <div className="a-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Detail</th>
                  <th>Age</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attentionRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="a-muted">
                      Nothing needs attention right now.
                    </td>
                  </tr>
                ) : (
                  attentionRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.type}</td>
                      <td className="a-cell-strong">{r.item}</td>
                      <td>{r.detail}</td>
                      <td className="a-muted">{r.age || "—"}</td>
                      <td>
                        <button
                          className="a-btn a-btn-ghost a-btn-sm"
                          onClick={() => onNavigate(r.goto)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-title-row">
            <h2>Quick actions</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="a-btn a-btn-ghost"
              style={{ justifyContent: "flex-start" }}
              onClick={() => onNavigate("knowledge-base")}
            >
              + New KB article
            </button>
            <button
              className="a-btn a-btn-ghost"
              style={{ justifyContent: "flex-start" }}
              onClick={() => onNavigate("refunds")}
            >
              Review pending refunds
            </button>
            <button
              className="a-btn a-btn-ghost"
              style={{ justifyContent: "flex-start" }}
              onClick={() => onNavigate("audit")}
            >
              View audit trail
            </button>
            <button
              className="a-btn a-btn-ghost"
              style={{ justifyContent: "flex-start" }}
              onClick={() => onNavigate("metrics")}
            >
              Open metrics
            </button>
          </div>
          <div className="a-helper-text" style={{ marginTop: 14 }}>
            Signed in as Karim (ADMIN). Agent-role users don't see this
            console — enforced server-side per story A2.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
