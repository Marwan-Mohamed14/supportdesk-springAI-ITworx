// =============================================================================
// Mock data for the Admin Console pages.
//
// This stands in for the real API calls described in the user-stories doc.
// Swap each block for a fetch/axios call to the matching endpoint when the
// backend is ready:
//   kbArticles     -> GET  /api/kb/articles                (stories F1, F2)
//   refundQueue    -> GET  /api/assistant/refunds?status=pending   (story H5)
//   refundHistory  -> GET  /api/assistant/refunds?status=decided
//   auditLog       -> GET  /api/audit                       (story K4)
//   metrics        -> GET  /api/metrics                     (story L2)
// =============================================================================

export let kbArticles = [
  { id: 1, title: "Return & refund policy", category: "Policies", tags: ["refunds", "returns"], status: "published", lastIngested: "2026-08-01" },
  { id: 2, title: "Shipping timelines by region", category: "Shipping", tags: ["shipping"], status: "published", lastIngested: "2026-07-28" },
  { id: 3, title: "Warranty claims — storage devices", category: "Warranty", tags: ["warranty", "storage"], status: "stale", lastIngested: "2026-06-14" },
  { id: 4, title: "How to reset a customer password", category: "Account", tags: ["account", "security"], status: "draft", lastIngested: null },
  { id: 5, title: "Bulk order discount tiers", category: "Policies", tags: ["orders", "pricing"], status: "published", lastIngested: "2026-07-30" },
];

export let refundQueue = [
  { id: "RF-2031", order: "ORD-8895", customer: "Globex Industrial", requested: 1280.5, orderTotal: 12800.5, reason: "Damaged on arrival — 2 units", conversation: "cnv_88a1", status: "pending" },
  { id: "RF-2032", order: "ORD-8878", customer: "Wayne Enterprises", requested: 45000, orderTotal: 45000, reason: "Full order cancellation", conversation: "cnv_88b7", status: "pending" },
  { id: "RF-2033", order: "ORD-8901", customer: "Acme Corp Logistics", requested: 6000, orderTotal: 4250, reason: "Customer claims double charge", conversation: "cnv_88c2", status: "pending" },
];

export let refundHistory = [
  { order: "ORD-8720", customer: "Initech", amount: 320.0, decision: "approved", by: "Karim", when: "2026-08-02 14:12" },
  { order: "ORD-8701", customer: "Hooli", amount: 980.0, decision: "rejected", by: "Karim", when: "2026-08-01 09:45" },
];

export let auditLog = [
  { ts: "2026-08-04 10:12", actor: "Karim (ADMIN)", action: "kbIngest", target: "5 articles", result: "success", conversation: "—" },
  { ts: "2026-08-04 09:58", actor: "assistant", action: "issueRefund", target: "ORD-8895 · $1,280.50", result: "pending-confirmation", conversation: "cnv_88a1" },
  { ts: "2026-08-03 18:20", actor: "assistant", action: "escalateTicket", target: "TCK-4471", result: "success", conversation: "cnv_8721" },
  { ts: "2026-08-03 17:02", actor: "assistant", action: "createTicket", target: "TCK-4470", result: "success", conversation: "cnv_8710" },
  { ts: "2026-08-03 11:40", actor: "Sara (AGENT)", action: "issueRefund", target: "ORD-8555 · $9,000.00", result: "rejected — exceeds order total", conversation: "cnv_8654" },
  { ts: "2026-08-02 14:12", actor: "Karim (ADMIN)", action: "issueRefund", target: "ORD-8720 · $320.00", result: "approved", conversation: "cnv_8590" },
];

export const ticketsByCategory = [
  { label: "Shipping", value: 128, color: "var(--admin-blue-accent)" },
  { label: "Billing", value: 94, color: "var(--admin-red)" },
  { label: "Warranty", value: 51, color: "var(--admin-yellow)" },
  { label: "Account", value: 27, color: "var(--admin-green)" },
  { label: "Other", value: 12, color: "var(--admin-grey-dim)" },
];

export const toolCallVolume = [
  { label: "getOrderStatus", value: 412 },
  { label: "checkInventory", value: 260 },
  { label: "createTicket", value: 118 },
  { label: "escalateTicket", value: 54 },
  { label: "issueRefund", value: 30 },
];

export const money = (n) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
