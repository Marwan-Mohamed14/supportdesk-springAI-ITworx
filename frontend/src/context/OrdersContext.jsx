import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'supportdesk.orders';

function tsLabel(ts) {
  const d = new Date(ts);
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return `${datePart}, ${timePart}`;
}
function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const DEFAULT_ORDERS = [
  {
    id: "ORD-24817", status: "Delivered", kind: "order",
    title: "Dell Latitude 5550 · Docking Station WD22TB4",
    date: "12 Jul 2026", units: 4, requestedBy: "Nour Adel",
    department: "IT Operations", total: 6480.0,
    shippingAddress: "ITWorx Smart Village, Building B12, Giza, Egypt",
    carrier: "Aramex Business", trackingNumber: "AWX-88213904",
    notes: "Docking stations to be pre-configured with dual-monitor profiles before handover.",
    lineItems: [
      { name: "Dell Latitude 5550 Laptop", qty: 4, unitPrice: 1350.0 },
      { name: "Docking Station WD22TB4", qty: 4, unitPrice: 270.0 },
    ],
    timeline: [
      { label: "Order placed", date: "28 Jun 2026" },
      { label: "Processing", date: "30 Jun 2026" },
      { label: "Shipped", date: "07 Jul 2026" },
      { label: "Delivered", date: "12 Jul 2026" },
    ],
  },
  {
    id: "ORD-24796", status: "Processing", kind: "order",
    title: "Microsoft 365 E3 licences (annual renewal)",
    date: "04 Jul 2026", units: 25, requestedBy: "Karim Fahmy",
    department: "IT Procurement", total: 10950.0,
    shippingAddress: "Digital delivery — no physical shipment",
    carrier: "—", trackingNumber: "—",
    notes: "Annual renewal for the Engineering and Design teams.",
    lineItems: [{ name: "Microsoft 365 E3 licence (1 yr)", qty: 25, unitPrice: 438.0 }],
    timeline: [
      { label: "Order placed", date: "04 Jul 2026" },
      { label: "Processing", date: "04 Jul 2026" },
      { label: "Shipped", date: null },
      { label: "Delivered", date: null },
    ],
  },
  {
    id: "ORD-24755", status: "Shipped", kind: "order",
    title: "Logitech MX Master 3S · Keyboard MX Keys",
    date: "22 Jun 2026", units: 12, requestedBy: "Salma Hassan",
    department: "People & Workplace", total: 1740.0,
    shippingAddress: "ITWorx Maadi Office, 3rd Floor, Cairo, Egypt",
    carrier: "Bosta", trackingNumber: "BST-55210871",
    notes: "For new hires starting next onboarding cohort.",
    lineItems: [
      { name: "Logitech MX Master 3S Mouse", qty: 6, unitPrice: 110.0 },
      { name: "Logitech MX Keys Keyboard", qty: 6, unitPrice: 180.0 },
    ],
    timeline: [
      { label: "Order placed", date: "15 Jun 2026" },
      { label: "Processing", date: "17 Jun 2026" },
      { label: "Shipped", date: "22 Jun 2026" },
      { label: "Delivered", date: null },
    ],
  },
  {
    id: "ORD-24710", status: "Delivered", kind: "order",
    title: "Jabra Evolve2 65 Headsets",
    date: "09 Jun 2026", units: 8, requestedBy: "Omar Zaki",
    department: "Customer Support", total: 1992.0,
    shippingAddress: "ITWorx Smart Village, Building B12, Giza, Egypt",
    carrier: "Aramex Business", trackingNumber: "AWX-87765102",
    notes: "Replacement units for support desk agents.",
    lineItems: [{ name: "Jabra Evolve2 65 Headset", qty: 8, unitPrice: 249.0 }],
    timeline: [
      { label: "Order placed", date: "28 May 2026" },
      { label: "Processing", date: "30 May 2026" },
      { label: "Shipped", date: "04 Jun 2026" },
      { label: "Delivered", date: "09 Jun 2026" },
    ],
  },
  {
    id: "ORD-24688", status: "Cancelled", kind: "order",
    title: "Ubiquiti UniFi 6 Pro Access Points",
    date: "28 May 2026", units: 6, requestedBy: "Mariam Sobhy",
    department: "Network Infrastructure", total: 1134.0,
    shippingAddress: "ITWorx Smart Village, Building B12, Giza, Egypt",
    carrier: "—", trackingNumber: "—",
    notes: "Cancelled — replaced by a bulk order under ORD-24820.",
    lineItems: [{ name: "Ubiquiti UniFi 6 Pro Access Point", qty: 6, unitPrice: 189.0 }],
    timeline: [
      { label: "Order placed", date: "20 May 2026" },
      { label: "Processing", date: "22 May 2026" },
      { label: "Cancelled", date: "28 May 2026" },
    ],
  },
];

function withAuditDefaults(order, index) {
  const parsed = Date.parse(order.date);
  const createdAt = Number.isFinite(parsed) ? parsed : Date.now() - index * 86400000;
  return {
    ...order,
    kind: order.kind || "order",
    createdAt,
    activityLog: order.activityLog || [
      { action: "Order created", by: order.requestedBy, at: createdAt },
    ],
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => readStored() || DEFAULT_ORDERS.map(withAuditDefaults));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const nextOrderId = useCallback(() => {
    const maxNum = orders.reduce((max, o) => {
      const n = parseInt(o.id.replace("ORD-", ""), 10);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);
    return `ORD-${maxNum + 1}`;
  }, [orders]);

  const createManualOrder = useCallback((formData, actingUser) => {
    const newId = nextOrderId();
    const now = Date.now();
    const newOrder = {
      id: newId, status: "Processing", kind: "order", title: formData.title, date: tsLabel(now), createdAt: now,
      units: formData.units, requestedBy: actingUser, department: formData.department,
      total: formData.total, shippingAddress: formData.shippingAddress,
      carrier: "—", trackingNumber: "—", notes: formData.notes, lineItems: formData.lineItems,
      activityLog: [{ action: "Order created", by: actingUser, at: now }],
      timeline: [
        { label: "Order placed", date: todayLabel() },
        { label: "Processing", date: todayLabel() },
        { label: "Shipped", date: null },
        { label: "Delivered", date: null },
      ],
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, [nextOrderId]);

  // Stock-based rule: ordering an in-stock product creates a normal order;
  // ordering an out-of-stock/inactive one creates a Pre-Order instead,
  // which converts to a normal order once restocked (future work).
  const placeOrderFromProduct = useCallback((product, qty, actingUser) => {
    const isPreOrder = !product.active || product.stock <= 0;
    const now = Date.now();
    const newId = nextOrderId();
    const total = product.price * qty;
    const newOrder = {
      id: newId,
      status: isPreOrder ? "Pre-Order" : "Processing",
      kind: isPreOrder ? "preorder" : "order",
      title: product.name, date: tsLabel(now), createdAt: now,
      units: qty, requestedBy: actingUser, department: "—", total,
      shippingAddress: "Not specified", carrier: "—", trackingNumber: "—",
      notes: isPreOrder
        ? `Pre-ordered from the product catalog — will ship once "${product.name}" is back in stock.`
        : "Ordered from the product catalog.",
      lineItems: [{ name: product.name, qty, unitPrice: product.price }],
      activityLog: [{ action: isPreOrder ? "Pre-order placed" : "Order created", by: actingUser, at: now }],
      timeline: isPreOrder
        ? [{ label: "Pre-order placed", date: todayLabel() }, { label: "Awaiting stock", date: null }]
        : [
            { label: "Order placed", date: todayLabel() },
            { label: "Processing", date: todayLabel() },
            { label: "Shipped", date: null },
            { label: "Delivered", date: null },
          ],
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, [nextOrderId]);

  const reorder = useCallback((order, actingUser) => {
    const newId = nextOrderId();
    const now = Date.now();
    const newOrder = {
      ...order, id: newId, status: "Processing", kind: "order", date: tsLabel(now), createdAt: now,
      notes: `Reordered from ${order.id}.`,
      activityLog: [{ action: `Order created (reordered from ${order.id})`, by: actingUser, at: now }],
      timeline: [
        { label: "Order placed", date: todayLabel() },
        { label: "Processing", date: todayLabel() },
        { label: "Shipped", date: null },
        { label: "Delivered", date: null },
      ],
    };
    setOrders((prev) => [
      newOrder,
      ...prev.map((o) =>
        o.id === order.id
          ? { ...o, activityLog: [...o.activityLog, { action: `Reordered as ${newId}`, by: actingUser, at: now }] }
          : o
      ),
    ]);
    return newOrder;
  }, [nextOrderId]);

  const cancelOrder = useCallback((order, actingUser) => {
    const now = Date.now();
    const today = todayLabel();
    const completedSteps = order.timeline.filter((s) => s.date && s.label !== "Cancelled");
    const updated = {
      status: "Cancelled",
      notes: `Cancelled on ${today}. ${order.notes || ""}`.trim(),
      timeline: [...completedSteps, { label: "Cancelled", date: today }],
      activityLog: [...order.activityLog, { action: "Order cancelled", by: actingUser, at: now }],
    };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    return updated;
  }, []);

  const value = useMemo(
    () => ({ orders, createManualOrder, placeOrderFromProduct, reorder, cancelOrder, tsLabel, todayLabel }),
    [orders, createManualOrder, placeOrderFromProduct, reorder, cancelOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
