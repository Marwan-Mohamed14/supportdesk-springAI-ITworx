import { NavLink, Outlet } from "react-router-dom";

/* ============================================================
   Thin admin section chrome — just a tab bar between the 4
   existing admin pages. Deliberately minimal: each admin page
   (metrics/kb/refunds/audit) already renders its own full header,
   auth pill and sign-out via AdminPageHeader (see
   pages/admin/admin-shared.jsx) — this layout would only
   duplicate that if it tried to add more chrome.

   No "back to app" link here on purpose: access is role-based and
   exclusive (see ProtectedRoute in App.jsx) — an ADMIN account has
   no customer-shell pages to go back to, only the other admin tabs.
   ============================================================ */

const COLORS = {
  ink: "#101820", panelHi: "#242F39", red: "#C63527",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const TABS = [
  { to: "/admin/metrics", label: "Metrics" },
  { to: "/admin/kb", label: "Knowledge Base" },
  { to: "/admin/refunds", label: "Refunds" },
  { to: "/admin/audit", label: "Audit Trail" },
];

export default function AdminLayout() {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 20px", borderBottom: `1px solid ${COLORS.line}`, overflowX: "auto" }}>
        <nav style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: "6px 12px", borderRadius: 999, fontFamily: FONT, fontSize: 13, fontWeight: 600,
                textDecoration: "none", whiteSpace: "nowrap",
                color: isActive ? COLORS.white : COLORS.grey,
                background: isActive ? "rgba(198,53,39,0.16)" : "transparent",
                border: isActive ? `1px solid ${COLORS.red}` : "1px solid transparent",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
