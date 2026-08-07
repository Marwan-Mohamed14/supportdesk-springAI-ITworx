import { LogOut, Package, PanelLeft, Ticket, FileText } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/* ============================================================
   Shared app shell for the signed-in customer/agent experience —
   sidebar nav (Products/Tickets/Orders) that actually routes,
   replacing the decorative nav buttons orders.jsx used to render
   on its own (they only flipped local state, never navigated).
   Renders once around every route in this section; each page
   renders into the <Outlet/> below.
   ============================================================ */

const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const NAV_ITEMS = [
  { to: "/products", label: "Products", icon: Package },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/orders", label: "Orders", icon: FileText },
];

export default function AppShell() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <aside style={{ width: 220, flexShrink: 0, padding: "20px 16px", background: COLORS.ink, borderRight: `1px solid ${COLORS.line}`, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", marginBottom: 32 }}>
          <PanelLeft size={18} color={COLORS.greyDim} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>
            <span style={{ color: COLORS.white }}>IT</span><span style={{ color: COLORS.red }}>Worx</span>
          </span>
        </div>

        <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim, padding: "0 12px", marginBottom: 8 }}>
          Categories
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10, borderRadius: 8, padding: "8px 12px",
                fontFamily: FONT, fontSize: 14, textDecoration: "none",
                background: isActive ? COLORS.panelHi : "transparent", color: isActive ? COLORS.white : COLORS.greyDim,
              })}
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 20, borderTop: `1px solid ${COLORS.line}` }}>
          <span style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.white, background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "6px 10px", textAlign: "center" }}>
            {user?.name} · {role}
          </span>
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 999, padding: "8px 11px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
