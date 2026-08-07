import React, { useState, useMemo, useEffect } from "react";
import {
  RotateCcw, Search,
  ArrowLeft, Check, Truck, MapPin, User, Building2, X, Plus, Minus,
  Ban, AlertTriangle, History,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrders } from "../../context/OrdersContext.jsx";

/* ============================================================
   Orders page
   ------------------------------------------------------------
   Order state/logic lives in context/OrdersContext.jsx now (shared
   with the product detail page, which creates orders/pre-orders
   directly from the catalog). This file is just the UI: the order
   list (split into Ordered / Pre-Orders tabs), the detail view,
   and the manual "New order" / cancel modals.

   Backend contract (Spring):
     GET    /api/orders
     POST   /api/orders               body: {title, units, unitPrice, requestedBy, department, shippingAddress, notes}
     POST   /api/orders/{id}/reorder
     POST   /api/orders/{id}/cancel
   OrdersContext currently mocks this with localStorage-backed state;
   swap its internals for real fetch() calls once the backend exists.
   ============================================================ */

const COLORS = {
  ink: "#101820", panel: "#1B242C", panelHi: "#242F39",
  red: "#C63527", redDark: "#7C2529", blue: "#171C8F",
  white: "#FFFFFF", grey: "#D0D3D4", greyDim: "#78808A",
  line: "rgba(208,211,212,0.16)", yellow: "#F8CE46", green: "#31B456",
};
const FONT = `"Segoe UI", "Segoe UI Semibold", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif`;

const STATUS_STYLES = {
  Delivered: { dot: COLORS.green, bg: "rgba(49, 180, 86, 0.14)", fg: "#5FCE7D" },
  Processing: { dot: COLORS.yellow, bg: "rgba(248, 206, 70, 0.14)", fg: COLORS.yellow },
  Shipped: { dot: "#4A54E1", bg: "rgba(23, 28, 143, 0.22)", fg: "#7C85F0" },
  Cancelled: { dot: COLORS.red, bg: "rgba(198, 53, 39, 0.16)", fg: "#E2685C" },
  "Pre-Order": { dot: "#2FB6C4", bg: "rgba(47, 182, 196, 0.14)", fg: "#5FD6E0" },
};

const FILTERS = ["All", "Delivered", "Shipped", "Processing", "Cancelled"];

function currency(n) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Precise timestamp label — date + time down to the second, used for
// the activity log so simultaneous-day actions still order correctly.
function tsLabel(ts) {
  const d = new Date(ts);
  const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${datePart}, ${timePart}`;
}

/* ---------- shared small pieces ---------- */

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Processing;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.bg, color: s.fg, borderRadius: 999,
      padding: "4px 10px", fontFamily: FONT, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

function HoverButton({ children, onClick, type = "button", primary, danger, style }) {
  const [hover, setHover] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 8, padding: "10px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap", transition: "background .15s",
  };
  let variant;
  if (primary) {
    variant = { background: hover ? COLORS.redDark : COLORS.red, color: COLORS.white, border: "none" };
  } else if (danger) {
    variant = {
      background: hover ? "rgba(198,53,39,0.12)" : "transparent",
      color: "#E2685C", border: `1px solid rgba(198,53,39,0.4)`,
    };
  } else {
    variant = {
      background: hover ? COLORS.panelHi : "transparent",
      color: COLORS.grey, border: `1px solid ${COLORS.line}`,
    };
  }
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variant, ...style }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, valueColor }) {
  return (
    <div style={{
      background: COLORS.panel, border: `1px solid ${COLORS.line}`,
      borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 180,
    }}>
      <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: valueColor || COLORS.white, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function OrderRow({ order, onViewDetails, onReorder, onCancel }) {
  const isCancellable = order.status === "Processing" || order.status === "Shipped";
  return (
    <div style={{
      background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12,
      padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, color: COLORS.white }}>{order.id}</span>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 15, color: COLORS.grey, marginTop: 6 }}>{order.title}</div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 4 }}>
          {order.date} · {order.units} units · Requested by {order.requestedBy}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24, marginLeft: "auto" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>Total</div>
          <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white }}>{currency(order.total)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {order.kind !== "preorder" && (
            <HoverButton primary onClick={() => onReorder(order)}>
              <RotateCcw size={14} /> Reorder
            </HoverButton>
          )}
          <HoverButton onClick={() => onViewDetails(order)}>View details</HoverButton>
          {isCancellable && (
            <HoverButton danger onClick={() => onCancel(order)}>
              <Ban size={14} /> Cancel order
            </HoverButton>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{
        marginTop: 2, width: 32, height: 32, flexShrink: 0, borderRadius: 8,
        background: COLORS.panelHi, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} color={COLORS.greyDim} />
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.greyDim }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: COLORS.grey, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function OrderTimeline({ steps, cancelled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => {
        const done = Boolean(step.date);
        const isLast = i === steps.length - 1;
        const isCancelStep = cancelled && step.label === "Cancelled";
        const dotColor = isCancelStep ? COLORS.red : done ? COLORS.green : COLORS.panelHi;
        return (
          <div key={step.label} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: dotColor, display: "flex", alignItems: "center", justifyContent: "center",
                border: done || isCancelStep ? "none" : "1px solid rgba(208,211,212,0.3)",
              }}>
                {(done || isCancelStep) && <Check size={13} strokeWidth={3} color={COLORS.white} />}
              </div>
              {!isLast && (
                <div style={{
                  width: 1, flex: 1, minHeight: 24, margin: "4px 0",
                  background: done ? COLORS.green : COLORS.line,
                }} />
              )}
            </div>
            <div style={{ paddingBottom: 24 }}>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: done || isCancelStep ? COLORS.white : COLORS.greyDim }}>
                {step.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 2 }}>
                {step.date || "Pending"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: "20px", ...style }}>
      {children}
    </div>
  );
}

function ActivityLog({ entries }) {
  const sorted = [...entries].sort((a, b) => b.at - a.at);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {sorted.map((entry, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0",
          borderTop: i === 0 ? "none" : `1px solid rgba(208,211,212,0.1)`,
        }}>
          <div style={{
            width: 28, height: 28, flexShrink: 0, borderRadius: 8, marginTop: 1,
            background: COLORS.panelHi, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <History size={13} color={COLORS.greyDim} />
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 13.5, color: COLORS.white }}>
              {entry.action}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 2 }}>
              by {entry.by} · {tsLabel(entry.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderDetailsPage({ order, onBack, onReorder, onCancel }) {
  const isCancelled = order.status === "Cancelled";
  const isCancellable = order.status === "Processing" || order.status === "Shipped";

  return (
    <div style={{ maxWidth: 1200 }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 14, fontWeight: 600,
          color: COLORS.grey, background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to orders
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.red, marginBottom: 8 }}>
            ITWorx SupportDesk
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: COLORS.white, margin: 0 }}>{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.greyDim, maxWidth: 480, marginTop: 8 }}>{order.title}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isCancellable && (
            <HoverButton danger onClick={() => onCancel(order)}>
              <Ban size={14} /> Cancel order
            </HoverButton>
          )}
          {order.kind !== "preorder" && (
            <HoverButton primary onClick={() => onReorder(order)}>
              <RotateCcw size={14} /> Reorder
            </HoverButton>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Panel>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: COLORS.white, marginBottom: 16 }}>Items in this order</div>
            {order.lineItems.map((item, i) => (
              <div key={item.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0",
                borderTop: i === 0 ? "none" : `1px solid rgba(208,211,212,0.1)`,
              }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 14, color: COLORS.grey }}>{item.name}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 2 }}>
                    Qty {item.qty} · {currency(item.unitPrice)} each
                  </div>
                </div>
                <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: COLORS.white }}>
                  {currency(item.qty * item.unitPrice)}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, marginTop: 4, borderTop: `1px solid ${COLORS.line}` }}>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: COLORS.grey }}>Total</div>
              <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white }}>{currency(order.total)}</div>
            </div>
          </Panel>

          <Panel>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>Notes</div>
            <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.greyDim, margin: 0 }}>{order.notes}</p>
          </Panel>

          <Panel style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <InfoRow icon={User} label="Requested by" value={order.requestedBy} />
            <InfoRow icon={Building2} label="Department" value={order.department} />
            <InfoRow icon={MapPin} label="Shipping address" value={order.shippingAddress} />
            <InfoRow icon={Truck} label="Carrier / tracking" value={order.carrier === "—" ? "—" : `${order.carrier} · ${order.trackingNumber}`} />
          </Panel>

          <Panel>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: COLORS.white, marginBottom: 4 }}>Activity log</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginBottom: 12 }}>
              Every change made to this order, with who made it and exactly when.
            </div>
            <ActivityLog entries={order.activityLog || []} />
          </Panel>
        </div>

        <Panel style={{ height: "fit-content" }}>
          <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: COLORS.white, marginBottom: 20 }}>Order timeline</div>
          <OrderTimeline steps={order.timeline} cancelled={isCancelled} />
        </Panel>
      </div>
    </div>
  );
}

/* ---------- modals ---------- */

const fieldLabelStyle = {
  fontFamily: FONT, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
  textTransform: "uppercase", color: COLORS.greyDim,
};
const inputStyle = {
  border: `1px solid ${COLORS.line}`, background: COLORS.panelHi, color: COLORS.white,
  borderRadius: 8, padding: "10px 12px", fontFamily: FONT, fontSize: 14, outline: "none", width: "100%",
};

function FormField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ onClose, children, maxWidth = 480 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(16,24,32,0.72)", zIndex: 60, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto",
          background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 24,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onCreate }) {
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [department, setDepartment] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const total = (Number(qty) || 0) * (Number(unitPrice) || 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (!itemName.trim() || !requestedBy.trim() || !unitPrice || Number(qty) < 1) {
      setError("Please fill in the item, quantity, unit price and requester.");
      return;
    }
    onCreate({
      title: itemName.trim(),
      units: Number(qty),
      requestedBy: requestedBy.trim(),
      department: department.trim() || "—",
      shippingAddress: shippingAddress.trim() || "Not specified",
      notes: notes.trim() || "No additional notes.",
      lineItems: [{ name: itemName.trim(), qty: Number(qty), unitPrice: Number(unitPrice) }],
      total,
    });
  }

  return (
    <ModalShell onClose={onClose} maxWidth={520}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.red, marginBottom: 4 }}>
            ITWorx SupportDesk
          </div>
          <h2 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: COLORS.white, margin: 0 }}>New order</h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.greyDim, cursor: "pointer", padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormField label="Item / licence name">
          <input style={inputStyle} value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Dell Latitude 5550 Laptop" />
        </FormField>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormField label="Quantity">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}
                style={{ ...inputStyle, width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Minus size={14} />
              </button>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)}
                style={{ ...inputStyle, textAlign: "center" }} />
              <button type="button" onClick={() => setQty((q) => Number(q) + 1)}
                style={{ ...inputStyle, width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={14} />
              </button>
            </div>
          </FormField>
          <FormField label="Unit price (USD)">
            <input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00" style={inputStyle} />
          </FormField>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <FormField label="Requested by">
            <input style={inputStyle} value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Your name" />
          </FormField>
          <FormField label="Department">
            <input style={inputStyle} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. IT Operations" />
          </FormField>
        </div>

        <FormField label="Shipping address">
          <input style={inputStyle} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="e.g. ITWorx Smart Village, Giza, Egypt" />
        </FormField>

        <FormField label="Notes (optional)">
          <textarea rows={2} style={{ ...inputStyle, resize: "none" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." />
        </FormField>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.panelHi, borderRadius: 8, padding: "12px 16px" }}>
          <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: COLORS.grey }}>Estimated total</span>
          <span style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: COLORS.white }}>{currency(total || 0)}</span>
        </div>

        {error && <div style={{ fontFamily: FONT, fontSize: 14, color: "#E2685C" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
          <HoverButton onClick={onClose}>Cancel</HoverButton>
          <HoverButton primary type="submit">Place order</HoverButton>
        </div>
      </form>
    </ModalShell>
  );
}

function CancelOrderModal({ order, onClose, onConfirm }) {
  return (
    <ModalShell onClose={onClose} maxWidth={440}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
          background: "rgba(198,53,39,0.14)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertTriangle size={18} color="#E2685C" />
        </div>
        <div>
          <h2 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: COLORS.white, margin: 0 }}>Cancel {order.id}?</h2>
          <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.greyDim, margin: "4px 0 0" }}>{order.title}</p>
        </div>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.grey, marginBottom: 24 }}>
        This will mark the order as cancelled and stop any further fulfilment. This action can't be undone.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <HoverButton onClick={onClose}>Keep order</HoverButton>
        <HoverButton primary onClick={() => onConfirm(order)}><Ban size={14} /> Cancel order</HoverButton>
      </div>
    </ModalShell>
  );
}

/* ---------- page ---------- */

const TABS = [
  { key: "ordered", label: "Ordered" },
  { key: "preorder", label: "Pre-Orders" },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const actingUser = user?.name || "You";
  const { orders, createManualOrder, reorder, cancelOrder } = useOrders();

  const [activeTab, setActiveTab] = useState("ordered");
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function handleReorder(order) {
    const newOrder = reorder(order, actingUser);
    setToast(`Reorder placed — ${newOrder.id} created from ${order.id}`);
    setSelectedOrder(null);
    setActiveFilter("All");
    setActiveTab("ordered");
  }

  function handleCreateOrder(formData) {
    const newOrder = createManualOrder(formData, actingUser);
    setToast(`New order placed — ${newOrder.id}`);
    setShowNewOrderModal(false);
    setActiveFilter("All");
    setActiveTab("ordered");
  }

  function handleCancelOrder(order) {
    const updated = cancelOrder(order, actingUser);
    setToast(`${order.id} has been cancelled`);
    setCancelTarget(null);
    setSelectedOrder((prev) => (prev && prev.id === order.id ? { ...prev, ...updated } : prev));
  }

  const tabOrders = useMemo(
    () => orders.filter((o) => (activeTab === "preorder" ? o.kind === "preorder" : o.kind !== "preorder")),
    [orders, activeTab]
  );

  const filteredOrders = useMemo(() => {
    return tabOrders
      .filter((o) => {
        const matchesFilter = activeTab === "preorder" || activeFilter === "All" || o.status === activeFilter;
        const q = query.trim().toLowerCase();
        const matchesQuery = !q || o.id.toLowerCase().includes(q) || o.title.toLowerCase().includes(q) || o.requestedBy.toLowerCase().includes(q);
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tabOrders, activeFilter, query, activeTab]);

  const orderedOrders = useMemo(() => orders.filter((o) => o.kind !== "preorder"), [orders]);
  const preOrderCount = orders.length - orderedOrders.length;
  const awaitingDelivery = orderedOrders.filter((o) => ["Processing", "Shipped"].includes(o.status)).length;
  const spendToDate = orderedOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: COLORS.ink, color: COLORS.white, fontFamily: FONT, padding: "32px 40px" }}>
      {selectedOrder ? (
        <OrderDetailsPage
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onReorder={handleReorder}
          onCancel={setCancelTarget}
        />
      ) : (
        <div style={{ maxWidth: 1200 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: COLORS.red, marginBottom: 8 }}>
                ITWorx SupportDesk
              </div>
              <h1 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: COLORS.white, margin: 0 }}>Orders</h1>
              <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.greyDim, maxWidth: 420, marginTop: 8 }}>
                Every hardware, licence and accessory request you have raised, plus anything pre-ordered while out of stock.
              </p>
            </div>
            <HoverButton primary onClick={() => setShowNewOrderModal(true)}>New order</HoverButton>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    borderRadius: 10, padding: "9px 18px", fontFamily: FONT, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    border: isActive ? `1px solid ${COLORS.red}` : `1px solid ${COLORS.line}`,
                    color: isActive ? COLORS.white : COLORS.grey,
                    background: isActive ? "rgba(198,53,39,0.14)" : "transparent",
                  }}
                >
                  {t.label}{t.key === "preorder" && preOrderCount > 0 ? ` (${preOrderCount})` : ""}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <StatCard label="Orders this year" value={orderedOrders.length + 33} />
            <StatCard label="Spend to date" value={currency(spendToDate)} />
            <StatCard label="Awaiting delivery" value={awaitingDelivery} valueColor={COLORS.yellow} />
            <StatCard label="Pre-orders pending" value={preOrderCount} valueColor="#5FD6E0" />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            {activeTab === "ordered" ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      style={{
                        borderRadius: 999, padding: "6px 16px", fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: "pointer",
                        border: isActive ? `1px solid ${COLORS.red}` : `1px solid ${COLORS.line}`,
                        color: isActive ? COLORS.white : COLORS.grey,
                        background: isActive ? "rgba(198,53,39,0.14)" : "transparent",
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            ) : <div />}
            <div style={{ position: "relative" }}>
              <Search size={15} color={COLORS.greyDim} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search orders..."
                style={{ ...inputStyle, width: 220, paddingLeft: 36 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 40 }}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} onViewDetails={setSelectedOrder} onReorder={handleReorder} onCancel={setCancelTarget} />
              ))
            ) : (
              <Panel style={{ textAlign: "center", color: COLORS.greyDim, padding: "40px 20px" }}>
                {activeTab === "preorder"
                  ? "No pre-orders yet — order an out-of-stock product from the catalog to see it here."
                  : "No orders match this filter or search."}
              </Panel>
            )}
          </div>
        </div>
      )}

      {showNewOrderModal && <NewOrderModal onClose={() => setShowNewOrderModal(false)} onCreate={handleCreateOrder} />}
      {cancelTarget && <CancelOrderModal order={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelOrder} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 10, borderRadius: 8, padding: "12px 16px",
          fontFamily: FONT, fontSize: 14, fontWeight: 600, color: COLORS.white,
          background: COLORS.panelHi, border: `1px solid ${COLORS.line}`, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 50,
        }}>
          <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Check size={12} strokeWidth={3} color={COLORS.white} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
