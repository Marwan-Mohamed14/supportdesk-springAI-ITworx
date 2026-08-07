import React, { useCallback, useState } from "react";

/* ============================================================
   Shared helpers for the Products epic (catalog grid + product
   detail page). Mirrors the pattern already established in
   pages/admin/admin-shared.jsx — same COLORS, same hand-drawn
   Icon() approach (no icon library dependency for this epic's
   pages), so catalog.jsx and ProductDetail.jsx feel like one
   page instead of duplicating ~150 lines each.
   ============================================================ */

export const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", redDark: "#7C2529", blue: "#171C8F",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)", yellow: "#F8CE46", green: "#31B456",
};
export const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;
export const CATEGORIES = ["Peripherals", "Networking", "Storage", "Audio", "Displays", "Power", "Cables", "Licenses"];

// Deterministic accent color per category, used for the placeholder
// image tile on the browsing grid and the detail page (no real product
// photography exists in this mock).
export const CATEGORY_COLORS = {
  Peripherals: "#4A54E1", Networking: COLORS.green, Storage: COLORS.yellow,
  Audio: COLORS.red, Displays: COLORS.blue, Power: COLORS.greyDim,
  Cables: COLORS.grey, Licenses: COLORS.redDark,
};

export function uid() { return Math.random().toString(36).slice(2, 10); }
export function money(v) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v); }
export function fmtDate(iso) { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }

export function stockStatus(p) {
  if (!p.active) return { key: "inactive", label: "Unavailable", color: COLORS.greyDim, icon: "powerOff" };
  if (p.stock <= 0) return { key: "out", label: "Out of stock", color: COLORS.red, icon: "xCircle" };
  if (p.stock <= 5) return { key: "low", label: `Low stock — ${p.stock} left`, color: COLORS.yellow, icon: "alertTriangle" };
  return { key: "in", label: `${p.stock} in stock`, color: COLORS.green, icon: "checkCircle" };
}

// A product can be ordered normally only if it's active AND has stock —
// otherwise it's a pre-order (see OrdersContext.placeOrderFromProduct).
export function isPreOrderOnly(p) { return !p.active || p.stock <= 0; }

/* ---- Feather-style inline icons (no icon library dependency) —
        same set as admin-shared.jsx, plus a "star" for ratings. ---- */
export function Icon({ name, size = 14, color = "currentColor", style }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "search": return <svg {...c}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "x": return <svg {...c}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "plus": return <svg {...c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "minus": return <svg {...c}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "chevronDown": return <svg {...c}><polyline points="6 9 12 15 18 9"/></svg>;
    case "chevronLeft": return <svg {...c}><polyline points="15 18 9 12 15 6"/></svg>;
    case "power": return <svg {...c}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>;
    case "powerOff": return <svg {...c}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
    case "alertTriangle": return <svg {...c}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "checkCircle": return <svg {...c}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case "xCircle": return <svg {...c}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
    case "tag": return <svg {...c}><path d="M20.59 13.41L13 20.99a2 2 0 0 1-2.83 0L2 12.83V6a4 4 0 0 1 4-4h6.83a2 2 0 0 1 1.41.59l6.35 6.35a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "arrowUpDown": return <svg {...c}><polyline points="7 13 12 18 17 13"/><polyline points="7 11 12 6 17 11"/></svg>;
    case "pencil": return <svg {...c}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
    case "clock": return <svg {...c}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "star": return <svg {...c} fill={color} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "shoppingBag": return <svg {...c}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
    default: return null;
  }
}

export function CategoryPill({ category }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: COLORS.grey, background: "rgba(208,211,212,0.1)", border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: "3px 9px", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon name="tag" size={10} /> {category}
    </span>
  );
}

export function RatingLine({ rating, reviewCount, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 12.5, color: COLORS.grey }}>
      <Icon name="star" size={size} color={COLORS.yellow} />
      <span style={{ color: COLORS.white, fontWeight: 600 }}>{rating.toFixed(1)}</span>
      <span>· {reviewCount} ratings</span>
    </span>
  );
}

// Deterministic placeholder image tile — no real product photography in
// this mock, so a category-colored gradient with a centered icon stands
// in for one, consistently, everywhere a product's "image" is shown.
export function ProductImageTile({ category, size = "100%", iconSize = 40 }) {
  const color = CATEGORY_COLORS[category] || COLORS.grey;
  return (
    <div style={{
      width: size, aspectRatio: "1 / 1", borderRadius: 12,
      background: `linear-gradient(135deg, ${color}33, ${color}0d)`,
      border: `1px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon name="shoppingBag" size={iconSize} color={color} />
    </div>
  );
}

export const iconBtnStyle = { width: 26, height: 26, borderRadius: 6, border: `1px solid ${COLORS.line}`, background: COLORS.ink, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
export const inputStyle = { width: "100%", background: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 9, padding: "9px 11px", color: COLORS.white, fontFamily: FONT, fontSize: 13.5, outline: "none", boxSizing: "border-box" };
export function fieldLabel(text) { return <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: COLORS.grey, marginBottom: 5, display: "block" }}>{text}</span>; }

export function Modal({ title, onClose, children }) {
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

export function ProductForm({ initial, onSubmit, onCancel, error }) {
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
    <div style={{ position: "fixed", bottom: 20, right: 92, zIndex: 80, display: "flex", flexDirection: "column", gap: 8 }}>
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
