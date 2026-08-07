import React, { useState } from "react";
import { Check, ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrders, NEXT_STATUS } from "../../context/OrdersContext.jsx";
import { useProducts } from "../../context/ProductsContext.jsx";
import { money, fmtDate } from "../products/product-shared.jsx";

/* ============================================================
   Orders page — backed entirely by the real backend.
   ------------------------------------------------------------
   OrderController has no "list my orders" endpoint (only
   create / getById / updateStatus), so there is no way to ask the
   backend "what are my orders". What's shown here is exactly:
     - orders this browser has created (tracked locally by id, then
       always re-fetched live from GET /api/orders/{id} — see
       OrdersContext), and
     - anything looked up by id via the box below, using the same
       real endpoint (it has no ownership check, so any valid id
       works for any signed-in user).
   No shipping address / carrier / notes / cancel / reorder here —
   the backend has no such fields or actions, so nothing is invented
   to fill that gap. Status can only move forward (PLACED -> PAID ->
   SHIPPED -> DELIVERED), for ADMIN/AGENT, matching exactly what
   OrderService.isValidTransition allows.
   ============================================================ */

const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", redDark: "#7C2529", blue: "#171C8F",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)", yellow: "#F8CE46", green: "#31B456",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const STATUS_STYLES = {
  PLACED: { dot: COLORS.yellow, fg: COLORS.yellow, bg: "rgba(248, 206, 70, 0.14)" },
  PAID: { dot: "#4A54E1", fg: "#7C85F0", bg: "rgba(23, 28, 143, 0.22)" },
  SHIPPED: { dot: "#2FB6C4", fg: "#5FD6E0", bg: "rgba(47, 182, 196, 0.14)" },
  DELIVERED: { dot: COLORS.green, fg: "#5FCE7D", bg: "rgba(49, 180, 86, 0.14)" },
  CANCELLED: { dot: COLORS.red, fg: "#E2685C", bg: "rgba(198, 53, 39, 0.16)" },
};

const inputStyle = {
  border: `1px solid ${COLORS.line}`, background: COLORS.panelHi, color: COLORS.white,
  borderRadius: 8, padding: "10px 12px", fontFamily: FONT, fontSize: 14, outline: "none", width: "100%",
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PLACED;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: s.bg, color: s.fg, borderRadius: 999, padding: "4px 10px", fontFamily: FONT, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

function HoverButton({ children, onClick, type = "button", primary, disabled, style }) {
  const [hover, setHover] = useState(false);
  const variant = primary
    ? { background: disabled ? COLORS.panelHi : hover ? COLORS.redDark : COLORS.red, color: disabled ? COLORS.greyDim : COLORS.white, border: "none" }
    : { background: hover ? COLORS.panelHi : "transparent", color: COLORS.grey, border: `1px solid ${COLORS.line}` };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8,
        padding: "10px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "background .15s",
        ...variant, ...style,
      }}
    >
      {children}
    </button>
  );
}

function Panel({ children, style }) {
  return <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "20px", ...style }}>{children}</div>;
}

function OrderRow({ order, expanded, onToggle, canAdvance, onAdvance, advancing }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", cursor: "pointer" }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, color: COLORS.white }}>{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 6 }}>
            {order.orderDate ? fmtDate(order.orderDate) : "—"} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>Total</div>
            <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white }}>{money(Number(order.totalAmount))}</div>
          </div>
          <ChevronRight size={16} color={COLORS.greyDim} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 150ms" }} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.line}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT, fontSize: 13.5 }}>
              <div>
                <div style={{ color: COLORS.white }}>{item.productName}</div>
                <div style={{ color: COLORS.greyDim, fontSize: 12, marginTop: 2 }}>{item.productSku} · Qty {item.quantity} · {money(Number(item.unitPrice))} each</div>
              </div>
              <div style={{ color: COLORS.white, fontWeight: 700 }}>{money(Number(item.lineTotal))}</div>
            </div>
          ))}
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: COLORS.greyDim, marginTop: 4 }}>Order ID: {order.id}</div>
          {canAdvance && NEXT_STATUS[order.status] && (
            <HoverButton primary disabled={advancing} onClick={() => onAdvance(order)} style={{ alignSelf: "flex-start", marginTop: 6 }}>
              {advancing ? "Updating…" : `Advance to ${NEXT_STATUS[order.status]}`}
            </HoverButton>
          )}
        </div>
      )}
    </div>
  );
}

function LineItemRow({ line, products, onChange, onRemove, removable }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <select value={line.productId} onChange={(e) => onChange({ productId: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
        <option value="" disabled>Select a product…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id} disabled={!p.active || p.stock <= 0}>
            {p.name} — {money(Number(p.price))} {(!p.active || p.stock <= 0) ? "(unavailable)" : `(${p.stock} in stock)`}
          </option>
        ))}
      </select>
      <input
        type="number" min={1} value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })}
        style={{ ...inputStyle, width: 80 }}
      />
      {removable && (
        <button type="button" onClick={onRemove} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.greyDim, borderRadius: 8, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function NewOrderModal({ products, onClose, onCreate }) {
  const [lines, setLines] = useState([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateLine = (i, patch) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { productId: "", quantity: 1 }]);
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const total = lines.reduce((sum, l) => {
    const p = products.find((pr) => pr.id === l.productId);
    return sum + (p ? Number(p.price) * Number(l.quantity || 0) : 0);
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (lines.some((l) => !l.productId || Number(l.quantity) < 1)) {
      setError("Pick a product and a quantity of at least 1 for every line.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onCreate(lines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,24,32,0.72)", zIndex: 60, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: COLORS.white, margin: 0 }}>New order</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.greyDim, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map((line, i) => (
            <LineItemRow key={i} line={line} products={products} onChange={(patch) => updateLine(i, patch)} onRemove={() => removeLine(i)} removable={lines.length > 1} />
          ))}
          <HoverButton onClick={addLine} style={{ alignSelf: "flex-start" }}><Plus size={14} /> Add another item</HoverButton>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.panelHi, borderRadius: 8, padding: "12px 16px" }}>
            <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: COLORS.grey }}>Estimated total</span>
            <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white }}>{money(total)}</span>
          </div>

          {error && <div style={{ fontFamily: FONT, fontSize: 13.5, color: "#E2685C" }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
            <HoverButton onClick={onClose}>Cancel</HoverButton>
            <HoverButton primary type="submit" disabled={submitting}>{submitting ? "Placing…" : "Place order"}</HoverButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { role } = useAuth();
  const { orders, loading, error, placeOrder, lookupOrder, advanceStatus } = useOrders();
  const { products } = useProducts();

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [advancingId, setAdvancingId] = useState(null);
  const [toast, setToast] = useState(null);

  const canManageStatus = role === "ADMIN" || role === "AGENT";

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  };

  const handleCreate = async (items) => {
    const order = await placeOrder(items);
    setShowNewOrderModal(false);
    setExpandedId(order.id);
    showToast(`Order ${order.orderNumber} placed.`);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookingUp(true);
    setLookupError("");
    try {
      const found = await lookupOrder(lookupId.trim());
      setExpandedId(found.id);
      setLookupId("");
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleAdvance = async (order) => {
    setAdvancingId(order.id);
    try {
      const updated = await advanceStatus(order);
      showToast(`${updated.orderNumber} is now ${updated.status}.`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setAdvancingId(null);
    }
  };

  const totalSpend = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: COLORS.ink, color: COLORS.white, fontFamily: FONT, padding: "32px 40px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: COLORS.white, margin: 0 }}>Orders</h1>
            <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.greyDim, maxWidth: 460, marginTop: 8 }}>
              Orders you've placed from this browser, plus anything you look up by order ID below.
            </p>
          </div>
          <HoverButton primary onClick={() => setShowNewOrderModal(true)}><Plus size={14} /> New order</HoverButton>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <Panel style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>Tracked orders</div>
            <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: COLORS.white, marginTop: 6 }}>{orders.length}</div>
          </Panel>
          <Panel style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>Total spend</div>
            <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: COLORS.white, marginTop: 6 }}>{money(totalSpend)}</div>
          </Panel>
        </div>

        <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} color={COLORS.greyDim} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="Look up an order by its ID…" style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <HoverButton type="submit" disabled={lookingUp}>{lookingUp ? "Looking up…" : "Look up"}</HoverButton>
        </form>
        {lookupError && <div style={{ fontFamily: FONT, fontSize: 13, color: "#E2685C", marginTop: -10, marginBottom: 16 }}>{lookupError}</div>}

        {error && (
          <div style={{ background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontFamily: FONT, fontSize: 13 }}>
            Couldn't load your tracked orders — {error.message}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 40 }}>
          {loading ? (
            <Panel style={{ textAlign: "center", color: COLORS.greyDim }}>Loading…</Panel>
          ) : orders.length === 0 ? (
            <Panel style={{ textAlign: "center", color: COLORS.greyDim, padding: "40px 20px" }}>
              No orders yet — place one from the catalog or above, or look one up by ID.
            </Panel>
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId((id) => (id === order.id ? null : order.id))}
                canAdvance={canManageStatus}
                advancing={advancingId === order.id}
                onAdvance={handleAdvance}
              />
            ))
          )}
        </div>
      </div>

      {showNewOrderModal && (
        <NewOrderModal products={products} onClose={() => setShowNewOrderModal(false)} onCreate={handleCreate} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, borderRadius: 8, padding: "12px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 600, color: COLORS.white, background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 50 }}>
          <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={12} strokeWidth={3} color={COLORS.white} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
