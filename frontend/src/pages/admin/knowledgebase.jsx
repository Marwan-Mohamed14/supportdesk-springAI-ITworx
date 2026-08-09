import React, { useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminData } from "./AdminDataContext";

// Knowledge Base authoring & ingest — stories F1, F2.
//
// TODO when wiring to the real backend, replace the AdminDataContext mock
// mutators with real calls:
//   create -> POST /api/kb/articles
//   edit   -> PUT  /api/kb/articles/{id}
//   ingest -> POST /api/kb/ingest { articleId }  (omit articleId to re-ingest all)
export default function KnowledgeBase({ onNavigate = () => {} }) {
  const { kbArticles: articles, refundQueue, saveKbArticle, ingestKbArticle, ingestAllKb } = useAdminData();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", category: "", tags: "", body: "" });
  const [toast, setToast] = useState(null);

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.category))].sort(),
    [articles]
  );

  const filtered = articles.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    const matchesCategory = !category || a.category === category;
    const matchesStatus = !status || a.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const flash = (msg) => {
    setToast(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast(null), 3200);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ title: "", category: "", tags: "", body: "" });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({ title: a.title, category: a.category, tags: a.tags.join(", "), body: a.body || "" });
    setModalOpen(true);
  };

  const save = () => {
    const title = form.title.trim();
    const cat = form.category.trim();
    if (!title || !cat) {
      flash("Title and category are required.");
      return;
    }
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    saveKbArticle({ id: editingId, title, category: cat, tags, body: form.body });
    flash(editingId ? `Saved "${title}" — marked for re-ingest.` : `Created "${title}" as a draft.`);
    setModalOpen(false);
  };

  const ingestOne = (id) => {
    const a = articles.find((x) => x.id === id);
    ingestKbArticle(id);
    flash(`"${a.title}" re-ingested — old chunks replaced, no stale duplicates (story F2).`);
  };

  const ingestAll = () => {
    ingestAllKb();
    flash("Re-ingested all articles.");
  };

  const statusChip = (s) =>
    s === "published" ? (
      <span className="a-chip a-chip-published">Published</span>
    ) : s === "draft" ? (
      <span className="a-chip a-chip-draft">Draft</span>
    ) : (
      <span className="a-chip a-chip-stale">Needs re-ingest</span>
    );

  return (
    <AdminLayout
      active="knowledge-base"
      title="Knowledge Base"
      subtitle="Author articles and (re)ingest them into the vector store — stories F1, F2"
      pendingRefundCount={refundQueue.filter((r) => r.status === "pending").length}
      onNavigate={onNavigate}
      actions={
        <>
          <button className="a-btn a-btn-ghost" onClick={ingestAll}>
            ↻ Re-ingest all
          </button>
          <button className="a-btn a-btn-primary" onClick={openNew}>
            + New article
          </button>
        </>
      }
    >
      <div className="a-toolbar">
        <input
          className="a-search-input"
          placeholder="Search title or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="a-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="a-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="stale">Needs re-ingest</option>
        </select>
      </div>

      <div className="a-card">
        <div className="a-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Last ingested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="a-muted">
                    No articles match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="a-cell-strong">{a.title}</td>
                    <td>{a.category}</td>
                    <td className="a-muted">{a.tags.join(", ")}</td>
                    <td>{statusChip(a.status)}</td>
                    <td className="a-muted">{a.lastIngested || "Never"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => openEdit(a)}>
                        Edit
                      </button>{" "}
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => ingestOne(a.id)}>
                        Re-ingest
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="a-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="a-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit article" : "New KB article"}</h2>
            <div className="a-modal-sub">
              Content saved here is used to ground the assistant's answers once ingested.
            </div>
            <div className="a-field">
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Return & refund policy"
              />
            </div>
            <div className="a-field-row">
              <div className="a-field">
                <label>Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Policies"
                />
              </div>
              <div className="a-field">
                <label>Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="refunds, returns"
                />
              </div>
            </div>
            <div className="a-field">
              <label>Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Article content…"
              />
            </div>
            <div className="a-modal-actions">
              <button className="a-btn a-btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="a-btn a-btn-primary" onClick={save}>
                Save article
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="a-toast">{toast}</div>}
    </AdminLayout>
  );
}
