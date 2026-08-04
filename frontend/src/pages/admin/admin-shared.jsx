import React, { useState, useEffect, useCallback } from "react";

/* ============================================================
   Shared helpers for the four admin-only pages (Knowledge Base,
   Refund Approvals, Audit Trail, Metrics).

   Mirrors the pattern already established in pages/products/catalog.jsx
   (Epic B) — same COLORS, same hand-drawn Icon() approach (no icon
   library dependency), same DemoLoginPanel fallback and demo accounts,
   so all epic pages feel like one app even before a shared App shell
   exists. This file is only imported by the four admin pages — it is
   NOT a dependency other epics need to know about.
   ============================================================ */

export const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", redDark: "#7C2529", blue: "#171C8F",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)", yellow: "#F8CE46", green: "#31B456",
};
export const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

export function uid() { return Math.random().toString(36).slice(2, 10); }
export function money(v) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v); }

/* ---- Feather-style inline icons (no icon library dependency) —
        same set as catalog.jsx, extended with a few this cluster needs. ---- */
export function Icon({ name, size = 14, color = "currentColor", style }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "search": return <svg {...c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "x": return <svg {...c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "plus": return <svg {...c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "chevronDown": return <svg {...c}><polyline points="6 9 12 15 18 9"/></svg>;
    case "alertTriangle": return <svg {...c}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "checkCircle": return <svg {...c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "xCircle": return <svg {...c}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
    case "tag": return <svg {...c}><path d="M20.59 13.41L13 20.99a2 2 0 0 1-2.83 0L2 12.83V6a4 4 0 0 1 4-4h6.83a2 2 0 0 1 1.41.59l6.35 6.35a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "pencil": return <svg {...c}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
    case "lock": return <svg {...c}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case "logOut": return <svg {...c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "clock": return <svg {...c}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "refreshCw": return <svg {...c}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case "bookOpen": return <svg {...c}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case "creditCard": return <svg {...c}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "shield": return <svg {...c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "barChart": return <svg {...c}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
    default: return null;
  }
}

/* ---- Shared demo accounts, identical to catalog.jsx's, so the whole
        app uses one login during standalone testing before Epic A lands. ---- */
export const DEMO_ACCOUNTS = [
  { username: "sara", password: "agent123", role: "AGENT", displayName: "Sara" },
  { username: "karim", password: "admin123", role: "ADMIN", displayName: "Karim" },
];
const DEMO_SESSION_MS = 5 * 60 * 1000;

export function DemoLoginPanel({ onLogin, requireAdmin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const account = DEMO_ACCOUNTS.find(a => a.username === username.trim().toLowerCase());
    if (!account || account.password !== password) {
      setError("401 Unauthorized — invalid credentials. No token issued.");
      return;
    }
    if (requireAdmin && account.role !== "ADMIN") {
      setError("403 Forbidden — this page is admin-only (story A2). Try the karim/admin123 account.");
      return;
    }
    setError("");
    onLogin({ displayName: account.displayName, role: account.role, expiresAt: Date.now() + DEMO_SESSION_MS });
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 18, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="lock" size={16} color={COLORS.red} />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17 }}>Sign in (demo — replace with Epic A)</div>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey, marginBottom: 20 }}>
          This page has no real auth of its own. Once Epic A's login is wired up, pass its
          result in via the <code>auth</code> prop and delete this panel.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: COLORS.grey, marginBottom: 5, display: "block" }}>Username</span>
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: "9px 11px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none", boxSizing: "border-box" }}
              placeholder="karim" />
          </div>
          <div>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: COLORS.grey, marginBottom: 5, display: "block" }}>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width: "100%", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: "9px 11px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none", boxSizing: "border-box" }}
              placeholder="••••••••" />
          </div>
          {error && <div style={{ fontSize: 12.5, color: COLORS.red, fontFamily: FONT }}>{error}</div>}
          <button onClick={submit} style={{ background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginTop: 4 }}>
            Sign in
          </button>
        </div>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.line}`, fontFamily: FONT, fontSize: 11.5, color: COLORS.greyDim, lineHeight: 1.6 }}>
          Demo accounts: <code>sara / agent123</code> (AGENT), <code>karim / admin123</code> (ADMIN — required for this page)
        </div>
      </div>
    </div>
  );
}

/* ---- Shared page header: title · epic tag, session timer, auth pill, sign out.
        Matches catalog.jsx's header exactly so every page feels consistent. ---- */
export function AdminPageHeader({ title, epic, auth, usingDemoAuth, now, onSignOut }) {
  const secondsLeft = auth ? Math.max(0, Math.round((auth.expiresAt - now) / 1000)) : 0;
  const mm = String(Math.floor(secondsLeft / 60));
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "12px 28px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>{title} <span style={{ color: COLORS.grey, fontWeight: 400 }}>· {epic}</span></div>
        {auth && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {usingDemoAuth && (
              <span style={{ fontFamily: FONT, fontSize: 12, color: COLORS.grey, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={12} /> session {mm}:{ss}
              </span>
            )}
            <span style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.white, background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "5px 10px" }}>
              {auth.displayName} · {auth.role}
            </span>
            <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 999, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
              <Icon name="logOut" size={12} /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Shared "use demo auth, admin-only" hook — every admin page needs
        the same login/session-expiry/sign-out wiring around its `auth` prop. ---- */
export function useAdminAuth(authProp, onSignOutProp, pushToast) {
  const [demoAuth, setDemoAuth] = useState(null);
  const auth = authProp !== undefined ? authProp : demoAuth;
  const usingDemoAuth = authProp === undefined;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (usingDemoAuth && demoAuth && now > demoAuth.expiresAt) {
      setDemoAuth(null);
      pushToast && pushToast("Session expired — please sign in again.", "error");
    }
  }, [now, demoAuth, usingDemoAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = useCallback(() => {
    if (onSignOutProp) onSignOutProp();
    if (usingDemoAuth) setDemoAuth(null);
    pushToast && pushToast("Signed out.");
  }, [onSignOutProp, usingDemoAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  return { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role: auth ? auth.role : null };
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((message, type = "success") => {
    const id = uid();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, pushToast, dismiss };
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 80, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: COLORS.panelHi, border: `1px solid ${t.type === "error" ? COLORS.red : COLORS.line}`, borderRadius: 10, padding: "10px 14px", color: COLORS.white, minWidth: 240, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 12px 30px rgba(0,0,0,.35)", fontFamily: FONT, fontSize: 13.5 }}>
          <Icon name={t.type === "error" ? "xCircle" : "checkCircle"} size={16} color={t.type === "error" ? COLORS.red : COLORS.green} />
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{ color: COLORS.grey, background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,14,0.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 18, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.grey, cursor: "pointer" }}><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function fieldLabel(text) {
  return <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: COLORS.grey, marginBottom: 5, display: "block" }}>{text}</span>;
}

export const inputStyle = { width: "100%", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: "9px 11px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none", boxSizing: "border-box" };
export const iconBtnStyle = { width: 22, height: 22, borderRadius: 6, border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

export function StatChip({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 18px" }}>
      <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: color || COLORS.white, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontFamily: FONT, fontSize: 11, color: COLORS.grey, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
export function StatDivider() { return <div style={{ width: 1, background: COLORS.line, margin: "0 4px" }} />; }

/* ---- Admin-only gate: if signed in but NOT an admin, show 403 instead
        of the page content — these four pages have no agent-facing view. ---- */
export function AdminOnlyGate({ role }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>
      <Icon name="lock" size={28} color={COLORS.red} style={{ marginBottom: 10 }} />
      <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.white, marginBottom: 4 }}>403 Forbidden</div>
      <div style={{ fontSize: 13 }}>Signed in as {role} — this page is admin-only (story A2).</div>
    </div>
  );
}
