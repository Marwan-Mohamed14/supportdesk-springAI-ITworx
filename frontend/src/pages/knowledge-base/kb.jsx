import React, { useState, useMemo, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  Modal, fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate,
} from "../admin-shared.jsx";

/* ============================================================
   Epic F — Knowledge Base (author + ingest)
   ------------------------------------------------------------
   Scoped to just this epic on purpose, same as pages/products/catalog.jsx:
     - No app shell / router / nav here — a page component, meant to be
       routed to from a shared App.jsx once the frontend project is
       scaffolded.
     - Auth is NOT reimplemented here. Accepts the logged-in user via the
       `auth` prop: auth = { displayName, role: "AGENT"|"ADMIN", expiresAt }
       and calls `onSignOut()` on sign-out. Falls back to a local demo
       login (admin-only) so this page works standalone in `npm run dev`
       before Epic A is wired in. Delete the fallback once real auth exists.
     - Admin-only: there is no agent-facing view of this page (story A2).

   Backend contract (Spring):
     GET    /api/kb/articles?q=&category=&status=
     POST   /api/kb/articles          body: {title, category, tags[], body}
     PUT    /api/kb/articles/{id}     body: {title, category, tags[], body}
     POST   /api/kb/ingest            body: {articleId?}  (omit to re-ingest all)
   MOCK_MODE seeds local data so this page runs without a backend; swap in
   real fetch() calls per the endpoints above. Story F2: re-ingesting an
   article must replace its old vector-store chunks, not duplicate them —
   that's a backend concern once real ingest exists.
   ============================================================ */

const CATEGORIES = ["Policies", "Shipping", "Warranty", "Account", "Security"];

function seedArticles() {
  return [
    { id: 1, title: "Return & refund policy", category: "Policies", tags: ["refunds", "returns"], status: "published", lastIngested: "2026-08-01", body: "" },
    { id: 2, title: "Shipping timelines by region", category: "Shipping", tags: ["shipping"], status: "published", lastIngested: "2026-07-28", body: "" },
    { id: 3, title: "Warranty claims — storage devices", category: "Warranty", tags: ["warranty", "storage"], status: "stale", lastIngested: "2026-06-14", body: "" },
    { id: 4, title: "How to reset a customer password", category: "Account", tags: ["account", "security"], status: "draft", lastIngested: null, body: "" },
    { id: 5, title: "Bulk order discount tiers", category: "Policies", tags: ["orders", "pricing"], status: "published", lastIngested: "2026-07-30", body: "" },
  ];
}

function StatusChip({ status }) {
  const map = {
    published: { label: "Published", color: COLORS.green },
    draft: { label: "Draft", color: COLORS.greyDim },
    stale: { label: "Needs re-ingest", color: COLORS.yellow },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: s.color, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "3px 9px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} /> {s.label}
    </span>
  );
}

function ArticleForm({ initial, onSubmit, onCancel, error }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? { ...initial, tags: initial.tags.join(", ") } : { title: "", category: CATEGORIES[0], tags: "", body: "" });
  const [localErr, setLocalErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.title.trim()) return setLocalErr("title is required");
    if (!form.category.trim()) return setLocalErr("category is required");
    setLocalErr("");
    onSubmit({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      <div>{fieldLabel("Title")}<input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Return & refund policy" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          {fieldLabel("Category")}
          <input style={inputStyle} value={form.category} list="kb-category-options" onChange={e => set("category", e.target.value)} placeholder="e.g. Policies" />
          <datalist id="kb-category-options">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div style={{ flex: 1 }}>{fieldLabel("Tags (comma separated)")}<input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="refunds, returns" /></div>
      </div>
      <div>{fieldLabel("Body")}<textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: FONT }} value={form.body} onChange={e => set("body", e.target.value)} placeholder="Article content…" /></div>
      {(localErr || error) && <div style={{ fontSize: 12.5, color: COLORS.red, fontFamily: FONT }}>{localErr || error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button onClick={onCancel} style={{ flex: 1, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
        <button onClick={submit} style={{ flex: 1, background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.redDark} onMouseLeave={e => e.currentTarget.style.background = COLORS.red}>
          {isEdit ? "Save changes" : "Create article"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Default export — the actual page.
   Props:
     auth      — { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut — called when the user clicks "Sign out".
   ============================================================ */
export default function KnowledgeBasePage({ auth: authProp, onSignOut }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [articles, setArticles] = useState(seedArticles);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(a => {
      const matchesQ = !q || a.title.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
      const matchesCat = category === "All" || a.category === category;
      const matchesStatus = status === "all" || a.status === status;
      return matchesQ && matchesCat && matchesStatus;
    });
  }, [articles, query, category, status]);

  const stats = useMemo(() => ({
    total: articles.length,
    published: articles.filter(a => a.status === "published").length,
    stale: articles.filter(a => a.status === "stale").length,
    draft: articles.filter(a => a.status === "draft").length,
  }), [articles]);

  const handleCreate = (form) => {
    const nextId = Math.max(0, ...articles.map(a => a.id)) + 1;
    setArticles(list => [{ id: nextId, ...form, status: "draft", lastIngested: null }, ...list]);
    setModal(null); setModalError(""); pushToast(`Created "${form.title}" as a draft.`);
  };
  const handleUpdate = (form) => {
    setArticles(list => list.map(a => a.id === modal.article.id ? { ...a, ...form, status: "stale" } : a));
    setModal(null); setModalError(""); pushToast(`Saved "${form.title}" — marked for re-ingest.`);
  };
  const ingestOne = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    const a = articles.find(x => x.id === id);
    setArticles(list => list.map(x => x.id === id ? { ...x, status: "published", lastIngested: today } : x));
    pushToast(`"${a.title}" re-ingested — old chunks replaced, no stale duplicates (story F2).`);
  };
  const ingestAll = () => {
    const today = new Date().toISOString().slice(0, 10);
    setArticles(list => list.map(a => ({ ...a, status: "published", lastIngested: today })));
    pushToast("Re-ingested all articles.");
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <AdminPageHeader title="Knowledge Base" epic="Epic F" auth={auth} usingDemoAuth={usingDemoAuth} now={now} onSignOut={handleSignOut} />

      {!auth ? (
        usingDemoAuth ? <DemoLoginPanel onLogin={setDemoAuth} requireAdmin /> : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.grey, fontFamily: FONT }}>Not signed in.</div>
        )
      ) : role !== "ADMIN" ? (
        <AdminOnlyGate role={role} />
      ) : (
        <Fragment>
          <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }}>
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
              <StatChip label="Total articles" value={stats.total} />
              <StatDivider /><StatChip label="Published" value={stats.published} color={COLORS.green} />
              <StatDivider /><StatChip label="Needs re-ingest" value={stats.stale} color={COLORS.yellow} />
              <StatDivider /><StatChip label="Drafts" value={stats.draft} color={COLORS.greyDim} />
            </div>
          </div>

          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 320 }}>
                <Icon name="search" size={15} color={COLORS.grey} style={{ position: "absolute", left: 10, top: 10 }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title or tag…" style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="All">All categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="stale">Needs re-ingest</option>
                </select>
                <button onClick={ingestAll} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "0 14px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>
                  <Icon name="refreshCw" size={13} /> Re-ingest all
                </button>
                <button onClick={() => { setModal({ mode: "create" }); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.white, color: COLORS.ink, border: "none", borderRadius: 999, padding: "0 16px", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                  <Icon name="plus" size={14} /> New article
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
                <Icon name="bookOpen" size={26} color={COLORS.greyDim} />
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>No articles match these filters.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(a => (
                  <div key={a.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <Icon name="bookOpen" size={18} color={COLORS.grey} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: COLORS.white }}>{a.title}</div>
                      <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.grey, marginTop: 3 }}>{a.category} · {a.tags.join(", ") || "no tags"}</div>
                    </div>
                    <StatusChip status={a.status} />
                    <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, minWidth: 110 }}>
                      {a.lastIngested ? `Ingested ${a.lastIngested}` : "Never ingested"}
                    </div>
                    <button onClick={() => { setModal({ mode: "edit", article: a }); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                      <Icon name="pencil" size={12} /> Edit
                    </button>
                    <button onClick={() => ingestOne(a.id)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                      <Icon name="refreshCw" size={12} /> Re-ingest
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {modal && (
            <Modal title={modal.mode === "edit" ? "Edit article" : "New KB article"} onClose={() => setModal(null)}>
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey, marginBottom: 16 }}>
                Content saved here is used to ground the assistant's answers once ingested.
              </div>
              <ArticleForm
                initial={modal.mode === "edit" ? modal.article : null}
                onSubmit={modal.mode === "edit" ? handleUpdate : handleCreate}
                onCancel={() => setModal(null)}
                error={modalError}
              />
            </Modal>
          )}
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
