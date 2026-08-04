import React, { useState, useMemo, useCallback, useEffect, Fragment } from "react";

/* ============================================================
   Epic B — Product Catalog page
   ------------------------------------------------------------
   Scoped to just this epic on purpose:
     - No app shell / router / nav here — this is a page
       component, meant to be routed to from a shared App.jsx
       once the frontend project is scaffolded.
     - No AI assistant widget — that belongs to Epics G/H, not
       here.
     - Auth is NOT reimplemented here. This page accepts the
       logged-in user via the `auth` prop:
         auth = { displayName, role: "AGENT" | "ADMIN", expiresAt }
       and calls `onSignOut()` when the user signs out. Wire it
       up to whatever the Auth team (Epic A, pages/auth/) ends
       up building — a context, a prop from a router loader,
       whatever fits their implementation.
     - If no `auth` prop is passed, it falls back to a small
       local demo login (two hardcoded accounts) purely so this
       page keeps working standalone in `npm run dev` before
       Epic A is wired in. Delete DemoLoginPanel + the fallback
       branch once real auth is in place.

   Backend contract (Spring):
     GET    /api/products?q=&category=&page=&size=&sort=
     GET    /api/products/{id}
     POST   /api/products                body: {sku,name,price,category,stock}
     PUT    /api/products/{id}            body: {name,price,category}
     PATCH  /api/products/{id}/stock      body: {stock,active}
   MOCK_MODE seeds local data so this page runs without a
   backend; swap in real fetch() calls per the endpoints above.
   ============================================================ */

const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", redDark: "#7C2529", blue: "#171C8F",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)", yellow: "#F8CE46", green: "#31B456",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;
const CATEGORIES = ["Peripherals", "Networking", "Storage", "Audio", "Displays", "Power", "Cables", "Licenses"];

function uid() { return Math.random().toString(36).slice(2, 10); }

/* ---- Feather-style inline icons (no icon library dependency) ---- */
function Icon({ name, size = 14, color = "currentColor", style }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "search": return <svg {...c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "x": return <svg {...c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "plus": return <svg {...c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "minus": return <svg {...c}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "chevronDown": return <svg {...c}><polyline points="6 9 12 15 18 9"/></svg>;
    case "power": return <svg {...c}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>;
    case "powerOff": return <svg {...c}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
    case "alertTriangle": return <svg {...c}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "checkCircle": return <svg {...c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "xCircle": return <svg {...c}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
    case "tag": return <svg {...c}><path d="M20.59 13.41L13 20.99a2 2 0 0 1-2.83 0L2 12.83V6a4 4 0 0 1 4-4h6.83a2 2 0 0 1 1.41.59l6.35 6.35a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "arrowUpDown": return <svg {...c}><polyline points="7 13 12 18 17 13"/><polyline points="7 11 12 6 17 11"/></svg>;
    case "pencil": return <svg {...c}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
    case "lock": return <svg {...c}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case "logOut": return <svg {...c}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "clock": return <svg {...c}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    default: return null;
  }
}

/* ---- Real ITWorx icon mark (icon-only crop), extracted verbatim
        from ITWorx_Template.pptx/ppt/media/image6.svg. Used only
        as a small in-content graphic (empty state) — this page
        does NOT render the app-wide nav logo; that belongs to
        the shared shell once it exists. ---- */
const ITWORX_ICON_MARKUP = `<svg viewBox="95 75 425 420" xmlns="http://www.w3.org/2000/svg" overflow="hidden" style="display:block;height:100%;width:100%;">
<g><path d="M455.2 170.5 452.9 168C405.6 118.6 334.1 90.1 272.8 90.1L272.7 90.1C163.8 90.1 110.2 189.8 110.2 291.8 110.2 308.5 111.3 324.2 113.5 339L114.1 342.8C114.1 342.8 114.1 342.8 114.1 342.8 114.1 343 114.2 343.2 114.2 343.3L114.3 343.7 114.3 343.7C128.4 428.7 179.6 479.4 265.3 479.4 277.6 479.4 290.5 478.4 303.6 476.5L303.6 476.5 303.8 476.5C303.8 476.5 303.9 476.5 303.9 476.5 303.9 476.5 303.9 476.5 303.9 476.5L307.4 476C401.4 460.9 505 396.9 505 291.9L505 291.8C504.9 243.9 485.2 202.8 455.2 170.5ZM356.8 383.8C348.7 382.5 336.4 378.4 336.4 378.4 255.4 346.5 201.1 296.4 192.8 288.4L179.2 273.8C223.9 236.5 289.1 193.7 367.6 176 369 181.2 371.4 196 371.4 196 381 276.8 371.3 338.8 356.8 383.8Z" fill="#C63527"/>
<path d="M113.3 338.6 113.9 342.4C113.9 342.4 181.2 294.7 192.6 288.2L179.2 273.9C179.3 273.9 131.9 313.4 113.3 338.6Z" fill="#7C2529"/>
<path d="M371.5 195.8 367.7 176.1C367.7 176.1 403.5 166.3 452.6 167.7L455 170.2C455 170.2 415.6 177.7 371.5 195.8Z" fill="#7C2529"/>
<path d="M336.3 378.3 356.9 383.8C356.9 383.8 344.8 432.5 307.1 475.9L303.5 476.5C303.4 476.5 316.2 445.1 336.3 378.3Z" fill="#7C2529"/></g></svg>`;

function LogoIconOnly({ size = 22 }) {
  return (
    <div style={{ background: COLORS.white, borderRadius: "50%", width: size + 8, height: size + 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: ITWORX_ICON_MARKUP }} />
    </div>
  );
}

/* ---- Fallback demo login — ONLY used if this page is rendered
        without an `auth` prop (i.e. before Epic A is wired in).
        Delete this block once real auth/context exists. ---- */
const DEMO_ACCOUNTS = [
  { username: "sara", password: "agent123", role: "AGENT", displayName: "Sara" },
  { username: "karim", password: "admin123", role: "ADMIN", displayName: "Karim" },
];
const DEMO_SESSION_MS = 5 * 60 * 1000;

function DemoLoginPanel({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const account = DEMO_ACCOUNTS.find(a => a.username === username.trim().toLowerCase());
    if (!account || account.password !== password) {
      setError("401 Unauthorized — invalid credentials. No token issued.");
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
              placeholder="sara" />
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
          Demo accounts: <code>sara / agent123</code> (AGENT), <code>karim / admin123</code> (ADMIN)
        </div>
      </div>
    </div>
  );
}

function seedProducts() {
  const names = [
    ["Wireless Mesh Router X2", "Networking", 149.0], ["USB-C Dock Pro 12-in-1", "Peripherals", 89.0],
    ["1TB NVMe SSD", "Storage", 74.5], ["Noise-Cancel Headset H400", "Audio", 129.0],
    ["27in 4K Monitor", "Displays", 329.0], ["65W GaN Charger", "Power", 39.0],
    ["Braided USB-C Cable 2m", "Cables", 12.0], ["Support Pro License — Annual", "Licenses", 199.0],
    ["Mechanical Keyboard K7", "Peripherals", 79.0], ["Ergo Vertical Mouse", "Peripherals", 45.0],
    ["8-Port PoE Switch", "Networking", 159.0], ["2TB Portable HDD", "Storage", 64.0],
    ["Conference Speakerphone", "Audio", 189.0], ["34in Curved Monitor", "Displays", 449.0],
    ["Desktop Power Bank 20K", "Power", 55.0], ["HDMI 2.1 Cable 3m", "Cables", 15.0],
    ["Analytics Add-on License", "Licenses", 99.0], ["Webcam 4K Autofocus", "Peripherals", 69.0],
    ["Wi-Fi 6 Access Point", "Networking", 119.0], ["512GB microSD Pro", "Storage", 29.0],
    ["Studio Condenser Mic", "Audio", 139.0], ["Dual Monitor Arm Mount", "Displays", 59.0],
    ["Rack PDU 8-Outlet", "Power", 89.0], ["USB-A to C Adapter Pack", "Cables", 9.0],
  ];
  return names.map(([name, category, price], i) => {
    const stock = [0, 0, 3, 4, 22, 40, 2, 60, 15, 0, 8, 30][i % 12];
    const active = !(i % 9 === 8);
    const assigned = Math.floor(Math.random() * 6);
    const decommissioned = Math.floor(Math.random() * 3);
    const totalUnits = stock + assigned + decommissioned;
    const created = new Date(Date.now() - (i + 5) * 86400000 * 3);
    const modified = new Date(Date.now() - (i + 1) * 86400000);
    return { id: uid(), sku: `${category.slice(0, 3).toUpperCase()}-${1000 + i}`, name, category, price, active, stock, totalAssignedItems: assigned, totalDecommissioned: decommissioned, totalUnits, createdAt: created.toISOString(), modifiedAt: modified.toISOString() };
  });
}
function money(v) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
function stockStatus(p) {
  if (!p.active) return { key: "inactive", label: "Unavailable", color: COLORS.greyDim, icon: "powerOff" };
  if (p.stock <= 0) return { key: "out", label: "Out of stock", color: COLORS.red, icon: "xCircle" };
  if (p.stock <= 5) return { key: "low", label: `Low stock — ${p.stock} left`, color: COLORS.yellow, icon: "alertTriangle" };
  return { key: "in", label: `${p.stock} in stock`, color: COLORS.green, icon: "checkCircle" };
}

const iconBtnStyle = { width: 22, height: 22, borderRadius: 6, border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const pageBtnStyle = { height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "none", color: COLORS.white, fontFamily: FONT, fontSize: 12, fontWeight: 600 };
const inputStyle = { width: "100%", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: "9px 11px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none", boxSizing: "border-box" };

function StockGauge({ product }) {
  const status = stockStatus(product);
  const pct = product.totalUnits > 0 ? Math.min(100, Math.round((product.stock / product.totalUnits) * 100)) : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <Icon name={status.icon} size={13} color={status.color} />
        <span style={{ fontSize: 12, color: status.color, fontFamily: FONT, fontWeight: 600 }}>{status.label}</span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: COLORS.line, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: status.color, transition: "width 500ms cubic-bezier(.2,.8,.2,1)", borderRadius: 4 }} />
      </div>
    </div>
  );
}
function CategoryPill({ category }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: COLORS.grey, background: "rgba(208,211,212,0.1)", border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "3px 9px", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon name="tag" size={10} /> {category}
    </span>
  );
}
function StatChip({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 18px" }}>
      <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: color || COLORS.white, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontFamily: FONT, fontSize: 11, color: COLORS.grey, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
function Divider() { return <div style={{ width: 1, background: COLORS.line, margin: "0 4px" }} />; }

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,14,0.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 18, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.grey, cursor: "pointer" }}><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function fieldLabel(text) { return <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: COLORS.grey, marginBottom: 5, display: "block" }}>{text}</span>; }

function ProductForm({ initial, onSubmit, onCancel, error }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || { sku: "", name: "", price: "", category: CATEGORIES[0], stock: "" });
  const [localErr, setLocalErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!isEdit && !form.sku.trim()) return setLocalErr("sku is required");
    if (!form.name.trim()) return setLocalErr("name is required");
    if (form.price === "") return setLocalErr("price is required");
    if (Number(form.price) < 0) return setLocalErr("price must be >= 0");
    if (!isEdit) {
      if (form.stock === "") return setLocalErr("stock is required");
      if (Number(form.stock) < 0) return setLocalErr("stock must be >= 0");
    }
    setLocalErr(""); onSubmit(form);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {!isEdit && (<div>{fieldLabel("SKU")}<input style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }} value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} placeholder="CAT-1000" /></div>)}
      <div>{fieldLabel("Name")}<input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Product name" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>{fieldLabel("Price (USD)")}<input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00" /></div>
        <div style={{ flex: 1 }}>
          {fieldLabel("Category")}
          <input style={inputStyle} value={form.category} list="sdc-category-options" onChange={e => set("category", e.target.value)} placeholder="e.g. Peripherals" />
          <datalist id="sdc-category-options">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      {!isEdit && (<div>{fieldLabel("Initial stock")}<input style={inputStyle} type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" /></div>)}
      {(localErr || error) && <div style={{ fontSize: 12.5, color: COLORS.red, fontFamily: FONT }}>{localErr || error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={onCancel} style={{ flex: 1, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
        <button onClick={submit} style={{ flex: 1, background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.redDark} onMouseLeave={e => e.currentTarget.style.background = COLORS.red}>
          {isEdit ? "Save changes" : "Add product"}
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, role, index, onEdit, onStockChange, onToggleActive }) {
  const [expanded, setExpanded] = useState(false);
  const [localStock, setLocalStock] = useState(product.stock);
  useEffect(() => setLocalStock(product.stock), [product.stock]);
  const commitStock = (next) => { const c = Math.max(0, next); setLocalStock(c); onStockChange(product.id, c); };

  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10, opacity: product.active ? 1 : 0.72, transition: "transform 150ms, box-shadow 150ms, border-color 150ms" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,.35)"; e.currentTarget.style.borderColor = COLORS.greyDim; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = COLORS.line; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: COLORS.grey, fontVariantNumeric: "tabular-nums", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6px" }}>{product.sku}</span>
        {role === "ADMIN" ? (
          <button onClick={() => onEdit(product)} title="Edit name, price, or category" style={{ background: "none", border: "none", color: COLORS.grey, cursor: "pointer", padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = COLORS.white} onMouseLeave={e => e.currentTarget.style.color = COLORS.grey}>
            <Icon name="pencil" size={14} />
          </button>
        ) : (
          <span title="Admins only — 403 Forbidden" style={{ opacity: 0.35, cursor: "not-allowed" }}><Icon name="pencil" size={14} color={COLORS.greyDim} /></span>
        )}
      </div>
      <div>
        <h3 style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: COLORS.white, margin: 0, lineHeight: 1.3 }}>{product.name}</h3>
        <div style={{ marginTop: 6 }}><CategoryPill category={product.category} /></div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: COLORS.white, fontVariantNumeric: "tabular-nums" }}>{money(product.price)}</div>
      <StockGauge product={{ ...product, stock: localStock }} />
      {role !== "ADMIN" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${COLORS.line}`, paddingTop: 9, marginTop: 2, fontSize: 11, color: COLORS.greyDim, fontFamily: FONT }} title="Stock and availability changes require an ADMIN token — 403 Forbidden for agents">
          <Icon name="powerOff" size={11} /> Stock &amp; availability — admins only
        </div>
      )}
      {role === "ADMIN" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: `1px solid ${COLORS.line}`, paddingTop: 10, marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => commitStock(localStock - 1)} style={iconBtnStyle} aria-label="Decrease stock"><Icon name="minus" size={13} /></button>
            <span style={{ fontFamily: FONT, fontSize: 13, color: COLORS.white, width: 28, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{localStock}</span>
            <button onClick={() => commitStock(localStock + 1)} style={iconBtnStyle} aria-label="Increase stock"><Icon name="plus" size={13} /></button>
          </div>
          <button onClick={() => onToggleActive(product.id, !product.active)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", border: `1px solid ${COLORS.line}`, background: product.active ? "rgba(49,180,86,0.12)" : "rgba(198,53,39,0.12)", color: product.active ? COLORS.green : COLORS.red, borderRadius: 999, padding: "5px 10px" }}>
            <Icon name={product.active ? "power" : "powerOff"} size={12} />
            {product.active ? "Active" : "Disabled"}
          </button>
        </div>
      )}
      <button onClick={() => setExpanded(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.blue, fontSize: 11.5, fontFamily: FONT, fontWeight: 600, cursor: "pointer", padding: "2px 0", marginTop: role === "ADMIN" ? 0 : 2, alignSelf: "flex-start" }}>
        <Icon name="chevronDown" size={14} style={{ transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
        {expanded ? "Hide details" : "View operational detail"}
      </button>
      {expanded && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", fontFamily: FONT, fontSize: 11.5, color: COLORS.grey, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${COLORS.line}`, paddingTop: 10 }}>
          <span>Assigned: <b style={{ color: COLORS.white }}>{product.totalAssignedItems}</b></span>
          <span>Decommissioned: <b style={{ color: COLORS.white }}>{product.totalDecommissioned}</b></span>
          <span>Total units: <b style={{ color: COLORS.white }}>{product.totalUnits}</b></span>
          <span>Created: <b style={{ color: COLORS.white }}>{fmtDate(product.createdAt)}</b></span>
          <span style={{ gridColumn: "1 / -1" }}>Modified: <b style={{ color: COLORS.white }}>{fmtDate(product.modifiedAt)}</b></span>
        </div>
      )}
    </div>
  );
}

function Toasts({ toasts, onDismiss }) {
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

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
                 Pass this from wherever Epic A's login result lives
                 once it exists. If omitted, falls back to DemoLoginPanel.
     onSignOut — called when the user clicks "Sign out". Wire this to
                 Epic A's real sign-out once available.
   ============================================================ */
export default function ProductCatalogPage({ auth: authProp, onSignOut }) {
  const [demoAuth, setDemoAuth] = useState(null); // only used when no auth prop is passed
  const auth = authProp !== undefined ? authProp : demoAuth;
  const usingDemoAuth = authProp === undefined;

  const [now, setNow] = useState(Date.now());
  const [products, setProducts] = useState(() => seedProducts());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState("");
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = "success") => {
    const id = uid();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // Session-expiry tick — only meaningful while relying on DemoLoginPanel.
  // Once real auth is wired in, session expiry should live with Epic A.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (usingDemoAuth && demoAuth && now > demoAuth.expiresAt) {
      setDemoAuth(null);
      pushToast("Session expired — please sign in again.", "error");
    }
  }, [now, demoAuth, usingDemoAuth, pushToast]);

  const stats = useMemo(() => {
    const inStock = products.filter(p => p.active && p.stock > 5).length;
    const low = products.filter(p => p.active && p.stock > 0 && p.stock <= 5).length;
    const out = products.filter(p => !p.active || p.stock <= 0).length;
    return { total: products.length, inStock, low, out, categories: new Set(products.map(p => p.category)).size };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCat = category === "All" || p.category === category;
      const matchesStock = stockFilter === "all" ? true : stockFilter === "in" ? p.active && p.stock > 5 : stockFilter === "low" ? p.active && p.stock > 0 && p.stock <= 5 : !p.active || p.stock <= 0;
      return matchesQ && matchesCat && matchesStock;
    });
    const [key, dir] = sortKey.split("-");
    list.sort((a, b) => {
      let v = 0;
      if (key === "name") v = a.name.localeCompare(b.name);
      if (key === "price") v = a.price - b.price;
      if (key === "stock") v = a.stock - b.stock;
      return dir === "desc" ? -v : v;
    });
    return list;
  }, [products, query, category, stockFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, category, stockFilter, sortKey]);

  const handleCreate = (form) => {
    if (products.some(p => p.sku.toLowerCase() === form.sku.trim().toLowerCase())) {
      setModalError(`409 Conflict — a product with sku "${form.sku.trim()}" already exists.`);
      pushToast(`SKU "${form.sku.trim()}" already exists — choose a different one.`, "error");
      return;
    }
    const stock = Number(form.stock);
    const nowIso = new Date().toISOString();
    const product = { id: uid(), sku: form.sku.trim(), name: form.name.trim(), price: Number(form.price), category: form.category, active: true, stock, totalAssignedItems: 0, totalDecommissioned: 0, totalUnits: stock, createdAt: nowIso, modifiedAt: nowIso };
    setProducts(p => [product, ...p]);
    setModal(null); setModalError(""); pushToast("Product added.");
  };
  const handleUpdate = (form) => {
    setProducts(list => list.map(p => p.id === modal.product.id ? { ...p, name: form.name.trim(), price: Number(form.price), category: form.category, modifiedAt: new Date().toISOString() } : p));
    setModal(null); setModalError(""); pushToast("Product updated.");
  };
  const handleStockChange = (id, stock) => {
    setProducts(list => list.map(p => p.id === id ? { ...p, stock, totalUnits: stock + p.totalAssignedItems + p.totalDecommissioned, modifiedAt: new Date().toISOString() } : p));
    pushToast("Stock updated.");
  };
  const handleToggleActive = (id, active) => {
    setProducts(list => list.map(p => p.id === id ? { ...p, active, modifiedAt: new Date().toISOString() } : p));
    pushToast(active ? "Product re-activated." : "Product disabled.");
  };
  const clearFilters = () => { setQuery(""); setCategory("All"); setStockFilter("all"); };

  const role = auth ? auth.role : null;
  const secondsLeft = auth ? Math.max(0, Math.round((auth.expiresAt - now) / 1000)) : 0;
  const mm = String(Math.floor(secondsLeft / 60));
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    if (usingDemoAuth) setDemoAuth(null);
    pushToast("Signed out.");
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`
        * { box-sizing: border-box; }
        .sdc-noscroll::-webkit-scrollbar { display: none; }
        .sdc-noscroll { scrollbar-width: none; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "12px 28px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 }}>Product Catalog <span style={{ color: COLORS.grey, fontWeight: 400 }}>· Epic B</span></div>
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
              <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 999, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                <Icon name="logOut" size={12} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {!auth ? (
        usingDemoAuth ? <DemoLoginPanel onLogin={setDemoAuth} /> : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>
            Not signed in.
          </div>
        )
      ) : (
        <Fragment>
          <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }} className="sdc-noscroll">
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
              <StatChip label="Total SKUs" value={stats.total} />
              <Divider /><StatChip label="Healthy stock" value={stats.inStock} color={COLORS.green} />
              <Divider /><StatChip label="Low stock" value={stats.low} color={COLORS.yellow} />
              <Divider /><StatChip label="Unavailable" value={stats.out} color={COLORS.red} />
              <Divider /><StatChip label="Categories" value={stats.categories} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px", display: "flex", gap: 24 }}>
            <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ position: "relative" }}>
                <Icon name="search" size={15} color={COLORS.grey} style={{ position: "absolute", left: 10, top: 10 }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or SKU" style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.grey, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `2px solid ${COLORS.red}`, display: "inline-block", paddingBottom: 3 }}>Category</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {["All", ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setCategory(c)} style={{ textAlign: "left", background: category === c ? "rgba(198,53,39,0.14)" : "none", border: "none", color: category === c ? COLORS.red : COLORS.grey, fontFamily: FONT, fontSize: 13, fontWeight: category === c ? 600 : 400, padding: "6px 8px", borderRadius: 7, cursor: "pointer" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.grey, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `2px solid ${COLORS.red}`, display: "inline-block", paddingBottom: 3 }}>Stock status</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {[["all", "All"], ["in", "Healthy"], ["low", "Low"], ["out", "Unavailable"]].map(([k, label]) => (
                    <button key={k} onClick={() => setStockFilter(k)} style={{ textAlign: "left", background: stockFilter === k ? "rgba(198,53,39,0.14)" : "none", border: "none", color: stockFilter === k ? COLORS.red : COLORS.grey, fontFamily: FONT, fontSize: 13, fontWeight: stockFilter === k ? 600 : 400, padding: "6px 8px", borderRadius: 7, cursor: "pointer" }}>{label}</button>
                  ))}
                </div>
              </div>
              {(query || category !== "All" || stockFilter !== "all") && (
                <button onClick={clearFilters} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>Clear filters</button>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: COLORS.grey }}>{filtered.length} {filtered.length === 1 ? "product" : "products"}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="arrowUpDown" size={13} color={COLORS.grey} />
                  <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 9px", fontSize: 12.5 }}>
                    <option value="name-asc">Name (A–Z)</option>
                    <option value="price-asc">Price (low–high)</option>
                    <option value="price-desc">Price (high–low)</option>
                    <option value="stock-asc">Stock (low–high)</option>
                    <option value="stock-desc">Stock (high–low)</option>
                  </select>
                </div>
              </div>

              {role === "ADMIN" && (
                <div style={{ marginBottom: 16 }}>
                  <button onClick={() => { setModal({ mode: "create" }); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.white, color: COLORS.ink, border: "none", borderRadius: 999, padding: "9px 16px", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                    <Icon name="plus" size={14} /> Add product
                  </button>
                </div>
              )}

              {pageItems.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
                  <LogoIconOnly size={28} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No products match these filters.</div>
                    <div style={{ fontSize: 12.5, color: COLORS.grey }}>Try a different search term or clear the filters.</div>
                  </div>
                  <button onClick={clearFilters} style={{ background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 999, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Clear filters</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                  {pageItems.map((p, i) => (
                    <ProductCard key={p.id} product={p} role={role} index={i} onEdit={(prod) => { setModal({ mode: "edit", product: prod }); setModalError(""); }} onStockChange={handleStockChange} onToggleActive={handleToggleActive} />
                  ))}
                </div>
              )}

              {filtered.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, flexWrap: "wrap", gap: 12 }}>
                  <span style={{ fontSize: 12, color: COLORS.grey, fontVariantNumeric: "tabular-nums" }}>Page {page} of {totalPages} · {filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 12 }}>
                      {[8, 12, 20].map(s => <option key={s} value={s}>{s} / page</option>)}
                    </select>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...pageBtnStyle, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "default" : "pointer" }}>Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, idx, arr) => (
                      <Fragment key={n}>
                        {idx > 0 && arr[idx - 1] !== n - 1 && <span style={{ color: COLORS.greyDim, fontSize: 12 }}>…</span>}
                        <button onClick={() => setPage(n)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: page === n ? COLORS.red : "none", color: page === n ? COLORS.white : COLORS.grey, fontFamily: FONT, fontSize: 12.5, cursor: "pointer", fontVariantNumeric: "tabular-nums" }}>{n}</button>
                      </Fragment>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...pageBtnStyle, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "default" : "pointer" }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {modal?.mode === "create" && (<Modal title="Add product" onClose={() => setModal(null)}><ProductForm onSubmit={handleCreate} onCancel={() => setModal(null)} error={modalError} /></Modal>)}
          {modal?.mode === "edit" && (<Modal title="Edit product" onClose={() => setModal(null)}><ProductForm initial={modal.product} onSubmit={handleUpdate} onCancel={() => setModal(null)} error={modalError} /></Modal>)}
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
