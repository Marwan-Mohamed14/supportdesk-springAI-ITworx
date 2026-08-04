import React from "react";
import AdminLayout from "./AdminLayout";
import { useAdminData } from "./AdminDataContext";
import { ticketsByCategory, toolCallVolume } from "./mockData";

// Metrics / observability — story L2. Deliberately plain bar rows instead of
// a chart library: every bar carries a visible category name + value, so
// color is never the only way to read identity (see dataviz guidance).
// TODO: replace the two arrays with GET /api/metrics.
function BarList({ data, showLegend }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <>
      {data.map((d) => (
        <div className="a-bar-row" key={d.label}>
          <div className="a-bar-label">{d.label}</div>
          <div className="a-bar-track">
            <div
              className="a-bar-fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color || "var(--admin-blue-accent)",
              }}
            />
          </div>
          <div className="a-bar-value">{d.value.toLocaleString()}</div>
        </div>
      ))}
      {showLegend && (
        <div className="a-legend">
          {data.map((d) => (
            <div className="a-legend-item" key={d.label}>
              <span className="a-legend-dot" style={{ background: d.color }} />
              {d.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Metrics({ onNavigate = () => {} }) {
  const { refundQueue } = useAdminData();
  return (
    <AdminLayout
      active="metrics"
      title="Metrics"
      subtitle="Usage, load and AI-assistant cost — story L2"
      pendingRefundCount={refundQueue.filter((r) => r.status === "pending").length}
      onNavigate={onNavigate}
    >
      <div className="a-stat-row">
        <div className="a-stat-tile">
          <div className="a-num">312</div>
          <div className="a-label">Tickets (30d)</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num">874</div>
          <div className="a-label">Tool calls (30d)</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num">1.9M</div>
          <div className="a-label">Tokens (30d)</div>
        </div>
        <div className="a-stat-tile">
          <div className="a-num green">96%</div>
          <div className="a-label">Grounded answer rate</div>
        </div>
      </div>

      <div className="a-grid-2">
        <div className="a-card">
          <div className="a-card-title-row">
            <h2>Tickets by category (30d)</h2>
          </div>
          <BarList data={ticketsByCategory} showLegend />
        </div>

        <div className="a-card">
          <div className="a-card-title-row">
            <h2>Tool-call volume by tool (30d)</h2>
          </div>
          <BarList data={toolCallVolume} />
        </div>
      </div>
    </AdminLayout>
  );
}
