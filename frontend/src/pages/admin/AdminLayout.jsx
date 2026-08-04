import React from "react";
import "./admin.css";

// Shared shell (header + sidebar) for every admin-only page.
//
// `active` is one of: "dashboard" | "knowledge-base" | "refunds" | "audit" | "metrics"
// `onNavigate(pageKey)` is called when a sidebar item is clicked — wire this to
// your router (react-router's navigate(), Next's router.push(), etc).
// `title` / `subtitle` / `actions` fill the page header; `pendingRefundCount`
// drives the small badge next to "Refund Approvals".
export default function AdminLayout({
  active,
  title,
  subtitle,
  actions,
  pendingRefundCount = 0,
  onNavigate = () => {},
  children,
}) {
  const navItem = (key, icon, label, badge) => (
    <a
      className={`a-nav-item${active === key ? " active" : ""}`}
      href={`#${key}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(key);
      }}
    >
      <span className="a-nav-icon">{icon}</span>
      {label}
      {badge != null && badge > 0 && (
        <span className="a-chip a-chip-pending a-nav-badge">{badge}</span>
      )}
    </a>
  );

  return (
    <div className="admin-console">
      <div className="a-app">
        <header className="a-topbar">
          <div className="a-topbar-left">
            <div className="a-brand-mark">SD</div>
            <div className="a-brand-text">
              <div className="a-title">SupportDesk AI</div>
              <div className="a-subtitle">Admin Console</div>
            </div>
          </div>
          <div className="a-topbar-right">
            <button className="a-icon-btn" title="Notifications">
              🔔
            </button>
            <button className="a-icon-btn" title="Help">
              ?
            </button>
            <div className="a-user-pill">
              <div className="a-avatar">K</div>
              <span>Karim</span>
              <span className="a-role-badge">ADMIN</span>
            </div>
            <button className="a-signout-btn">Sign out →</button>
          </div>
        </header>

        <nav className="a-sidebar">
          <div className="a-nav-group-label">Operations</div>
          {navItem("dashboard", "▢", "Dashboard")}
          {navItem("orders", "📦", "Orders")}
          {navItem("products", "📊", "Products")}
          {navItem("tickets", "🎫", "Tickets")}
          {navItem("customers", "👥", "Customers")}

          <div className="a-nav-group-label">Admin only</div>
          {navItem("knowledge-base", "📚", "Knowledge Base")}
          {navItem("refunds", "💳", "Refund Approvals", pendingRefundCount)}
          {navItem("audit", "📋", "Audit Trail")}
          {navItem("metrics", "📈", "Metrics")}

          <div className="a-nav-group-label">System</div>
          {navItem("settings", "⚙", "Settings")}
          {navItem("support", "❓", "Support")}
        </nav>

        <main className="a-main">
          <div className="a-page-header">
            <div>
              <h1>{title}</h1>
              {subtitle && <div className="a-crumb">{subtitle}</div>}
            </div>
            {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
