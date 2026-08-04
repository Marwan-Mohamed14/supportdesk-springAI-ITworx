import React, { createContext, useContext, useState } from "react";
import {
  kbArticles as seedArticles,
  refundQueue as seedQueue,
  refundHistory as seedHistory,
  auditLog as seedAudit,
} from "./mockData";

// Single shared source of truth for the admin pages, so an action on one
// page (e.g. deciding a refund) is visible on another (e.g. the audit
// trail) within the same session — mirrors what the real backend will do
// once these are wired to actual API calls (GET /api/audit etc. would
// naturally include every action regardless of which page triggered it).
//
// Wrap the whole admin section in <AdminDataProvider> ONCE, above wherever
// your router renders these pages, then each page calls useAdminData().
const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [kbArticles, setKbArticles] = useState(seedArticles);
  const [refundQueue, setRefundQueue] = useState(seedQueue);
  const [refundHistory, setRefundHistory] = useState(seedHistory);
  const [auditLog, setAuditLog] = useState(seedAudit);

  const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

  const addAudit = (entry) => setAuditLog((prev) => [{ ts: now(), ...entry }, ...prev]);

  const saveKbArticle = ({ id, title, category, tags, body }) => {
    if (id) {
      setKbArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title, category, tags, body, status: "stale" } : a))
      );
    } else {
      setKbArticles((prev) => {
        const nextId = Math.max(0, ...prev.map((a) => a.id)) + 1;
        return [{ id: nextId, title, category, tags, body, status: "draft", lastIngested: null }, ...prev];
      });
    }
  };

  const ingestKbArticle = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    setKbArticles((prev) => prev.map((a) => (a.id === id ? { ...a, status: "published", lastIngested: today } : a)));
    const article = kbArticles.find((a) => a.id === id);
    addAudit({ actor: "Karim (ADMIN)", action: "kbIngest", target: article ? article.title : `article ${id}`, result: "success", conversation: "—" });
  };

  const ingestAllKb = () => {
    const today = new Date().toISOString().slice(0, 10);
    setKbArticles((prev) => prev.map((a) => ({ ...a, status: "published", lastIngested: today })));
    addAudit({ actor: "Karim (ADMIN)", action: "kbIngest", target: `${kbArticles.length} articles`, result: "success", conversation: "—" });
  };

  const decideRefund = (id, decision, reason) => {
    const r = refundQueue.find((x) => x.id === id);
    if (!r) return;
    setRefundQueue((prev) => prev.map((x) => (x.id === id ? { ...x, status: decision } : x)));
    setRefundHistory((prev) => [
      { order: r.order, customer: r.customer, amount: r.requested, decision, by: "Karim", when: now() },
      ...prev,
    ]);
    addAudit({
      actor: "Karim (ADMIN)",
      action: "issueRefund",
      target: `${r.order} · $${r.requested.toFixed(2)}`,
      result: decision + (reason ? ` — ${reason}` : ""),
      conversation: r.conversation,
    });
  };

  return (
    <AdminDataContext.Provider
      value={{
        kbArticles,
        refundQueue,
        refundHistory,
        auditLog,
        saveKbArticle,
        ingestKbArticle,
        ingestAllKb,
        decideRefund,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData() must be used inside <AdminDataProvider>. Wrap your admin routes with it once, above the router.");
  }
  return ctx;
}
