import type { Order } from "@/components/orders/OrderCard";

export type OrderLine = {
  name: string;
  sku: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type TimelineStep = {
  label: string;
  date: string;
  done: boolean;
};

export type OrderDetail = Order & {
  poNumber: string;
  paymentMethod: string;
  costCentre: string;
  shipTo: string[];
  carrier: string;
  tracking: string;
  subtotal: string;
  shipping: string;
  vat: string;
  lines: OrderLine[];
  timeline: TimelineStep[];
  notes: string;
};

export const ORDERS: OrderDetail[] = [
  {
    id: "ORD-24817",
    date: "12 Jul 2026",
    items: "Dell Latitude 5550 · Docking Station WD22TB4",
    units: 4,
    total: "$6,480.00",
    status: "delivered",
    requester: "Nour Adel",
    poNumber: "PO-2026-0417",
    paymentMethod: "Corporate account · Net 30",
    costCentre: "CC-4410 Engineering",
    shipTo: ["ITWorx Cairo HQ", "Smart Village, Building B12", "Giza, Egypt"],
    carrier: "Aramex Business",
    tracking: "ARX7741992284",
    subtotal: "$5,940.00",
    shipping: "$60.00",
    vat: "$480.00",
    lines: [
      { name: "Dell Latitude 5550", sku: "DL-5550-I7", qty: 2, unitPrice: "$2,320.00", lineTotal: "$4,640.00" },
      { name: "Dell Dock WD22TB4", sku: "DL-WD22TB4", qty: 2, unitPrice: "$650.00", lineTotal: "$1,300.00" },
    ],
    timeline: [
      { label: "Order placed", date: "12 Jul 2026", done: true },
      { label: "Approved by manager", date: "12 Jul 2026", done: true },
      { label: "Dispatched", date: "14 Jul 2026", done: true },
      { label: "Delivered", date: "16 Jul 2026", done: true },
    ],
    notes: "Assets tagged and enrolled in Intune before hand-over.",
  },
  {
    id: "ORD-24796",
    date: "04 Jul 2026",
    items: "Microsoft 365 E3 licences (annual renewal)",
    units: 25,
    total: "$10,950.00",
    status: "processing",
    requester: "Karim Fahmy",
    poNumber: "PO-2026-0402",
    paymentMethod: "Corporate account · Net 45",
    costCentre: "CC-2100 IT Operations",
    shipTo: ["Digital delivery", "licensing@itworx.com"],
    carrier: "Digital fulfilment",
    tracking: "—",
    subtotal: "$10,140.00",
    shipping: "$0.00",
    vat: "$810.00",
    lines: [
      { name: "Microsoft 365 E3 (annual)", sku: "MS-365-E3", qty: 25, unitPrice: "$405.60", lineTotal: "$10,140.00" },
    ],
    timeline: [
      { label: "Order placed", date: "04 Jul 2026", done: true },
      { label: "Approved by manager", date: "05 Jul 2026", done: true },
      { label: "Licence provisioning", date: "In progress", done: false },
      { label: "Assigned to users", date: "Pending", done: false },
    ],
    notes: "Seats to be assigned to the new delivery squad on activation.",
  },
  {
    id: "ORD-24755",
    date: "22 Jun 2026",
    items: "Logitech MX Master 3S · Keyboard MX Keys",
    units: 12,
    total: "$1,740.00",
    status: "shipped",
    requester: "Salma Hassan",
    poNumber: "PO-2026-0388",
    paymentMethod: "Corporate card ····4417",
    costCentre: "CC-3050 Delivery",
    shipTo: ["ITWorx Alexandria Office", "Smouha District", "Alexandria, Egypt"],
    carrier: "DHL Domestic",
    tracking: "DHL5540118827",
    subtotal: "$1,590.00",
    shipping: "$40.00",
    vat: "$110.00",
    lines: [
      { name: "Logitech MX Master 3S", sku: "LG-MXM3S", qty: 6, unitPrice: "$115.00", lineTotal: "$690.00" },
      { name: "Logitech MX Keys", sku: "LG-MXKEYS", qty: 6, unitPrice: "$150.00", lineTotal: "$900.00" },
    ],
    timeline: [
      { label: "Order placed", date: "22 Jun 2026", done: true },
      { label: "Approved by manager", date: "23 Jun 2026", done: true },
      { label: "Dispatched", date: "25 Jun 2026", done: true },
      { label: "Delivered", date: "Expected 30 Jun 2026", done: false },
    ],
    notes: "Split shipment — keyboards ship from the Alexandria warehouse.",
  },
  {
    id: "ORD-24710",
    date: "09 Jun 2026",
    items: "Jabra Evolve2 65 Headsets",
    units: 8,
    total: "$1,992.00",
    status: "delivered",
    requester: "Omar Zaki",
    poNumber: "PO-2026-0361",
    paymentMethod: "Corporate account · Net 30",
    costCentre: "CC-5200 Support",
    shipTo: ["ITWorx Cairo HQ", "Smart Village, Building B12", "Giza, Egypt"],
    carrier: "Aramex Business",
    tracking: "ARX7739110042",
    subtotal: "$1,832.00",
    shipping: "$25.00",
    vat: "$135.00",
    lines: [
      { name: "Jabra Evolve2 65", sku: "JB-EV2-65", qty: 8, unitPrice: "$229.00", lineTotal: "$1,832.00" },
    ],
    timeline: [
      { label: "Order placed", date: "09 Jun 2026", done: true },
      { label: "Approved by manager", date: "09 Jun 2026", done: true },
      { label: "Dispatched", date: "11 Jun 2026", done: true },
      { label: "Delivered", date: "13 Jun 2026", done: true },
    ],
    notes: "Two spare units held in the support desk locker.",
  },
  {
    id: "ORD-24688",
    date: "28 May 2026",
    items: "Ubiquiti UniFi 6 Pro Access Points",
    units: 6,
    total: "$1,134.00",
    status: "cancelled",
    requester: "Mariam Sobhy",
    poNumber: "PO-2026-0344",
    paymentMethod: "Corporate account · Net 30",
    costCentre: "CC-2100 IT Operations",
    shipTo: ["ITWorx Cairo HQ", "Smart Village, Building B12", "Giza, Egypt"],
    carrier: "—",
    tracking: "—",
    subtotal: "$1,050.00",
    shipping: "$0.00",
    vat: "$84.00",
    lines: [
      { name: "UniFi 6 Pro Access Point", sku: "UBI-U6-PRO", qty: 6, unitPrice: "$175.00", lineTotal: "$1,050.00" },
    ],
    timeline: [
      { label: "Order placed", date: "28 May 2026", done: true },
      { label: "Approved by manager", date: "29 May 2026", done: true },
      { label: "Cancelled by requester", date: "30 May 2026", done: true },
    ],
    notes: "Cancelled — network refresh moved to the Q4 infrastructure budget.",
  },
];

export function getOrder(id: string): OrderDetail | undefined {
  return ORDERS.find((o) => o.id === id);
}
