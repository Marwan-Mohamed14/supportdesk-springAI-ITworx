import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminData } from "./AdminDataContext";

// Audit Trail — story K4 (every side-effectful tool call recorded with
// actor, args/target, result, and conversation id).
// TODO: replace the AdminDataContext-backed `auditLog` with GET /api/audit
// (paginated/filtered server-side once the log is large; the client-side
// filtering here is fine for a demo).
export default function AuditTrail({ onNavigate = () => {} }) {
  const { auditLog, refundQueue } = useAdminData();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");

  const filtered = auditLog.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.conversation.toLowerCase().includes(q) ||
      a.actor.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q);
    const matchesAction = !action || a.action === action;
    return matchesSearch && matchesAction;
  });

  return (
    <AdminLayout
      active="audit"
      title="Audit Trail"
      subtitle="Every side-effectful tool call, recorded with actor, args and result — story K4"
      pendingRefundCount={refundQueue.filter((r) => r.status === "pending").length}
      onNavigate={onNavigate}
    >
      <div className="a-toolbar">
        <input
          className="a-search-input"
          placeholder="Search conversation id, actor, or action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="a-select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          <option value="createTicket">createTicket</option>
          <option value="escalateTicket">escalateTicket</option>
          <option value="issueRefund">issueRefund</option>
          <option value="kbIngest">kbIngest</option>
        </select>
      </div>

      <div className="a-card">
        <div className="a-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Result</th>
                <th>Conversation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="a-muted">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <tr key={i}>
                    <td className="a-muted">{a.ts}</td>
                    <td>{a.actor}</td>
                    <td className="a-cell-strong">{a.action}</td>
                    <td>{a.target}</td>
                    <td className="a-muted">{a.result}</td>
                    <td className="a-muted">{a.conversation}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
