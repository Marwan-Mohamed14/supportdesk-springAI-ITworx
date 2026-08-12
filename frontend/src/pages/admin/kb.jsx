import React, { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  COLORS, FONT, Icon, DemoLoginPanel, AdminPageHeader, useAdminAuth, useToasts, Toasts,
  Modal, fieldLabel, inputStyle, StatChip, StatDivider, AdminOnlyGate,
} from "./admin-shared.jsx";
import { listKbArticles, createKbArticle, updateKbArticle, ingestKbArticle, ingestAllKbArticles } from "../../lib/api.js";

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

   Backed by the real backend: /api/kb/articles (ADMIN only, see
   SecurityConfig). `token` is supplied by withAdminAuth alongside `auth` —
   the demo login fallback above has no real token, so it shows an
   explanatory message instead of a confusing fetch failure.

   Scope note (story F2): "re-ingest" here means what the backend can
   honestly do today — mark the article published and stamp when. It does
   NOT push the article's body into the chatbot's vector store yet; that's
   a separate, larger change to the existing RAG pipeline (AiConfig /
   KnowledgeBaseLoader / ChatbotService) and is intentionally out of scope
   here so this fix can't destabilize the chatbot feature.
   ============================================================ */

const CATEGORIES = ["Policies", "Shipping", "Warranty", "Account", "Security"];

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

function ArticleForm({ initial, onSubmit, onCancel, error, submitting }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? { ...initial, tags: (initial.tags || []).join(", ") } : { title: "", category: CATEGORIES[0], tags: "", body: "" });
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
        <button onClick={submit} disabled={submitting} style={{ flex: 1, background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 9, padding: "10px 0", fontFamily: FONT, fontWeight: 600, fontSize: 13.5, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
          onMouseEnter={e => !submitting && (e.currentTarget.style.background = COLORS.redDark)} onMouseLeave={e => !submitting && (e.currentTarget.style.background = COLORS.red)}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create article"}
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
     token     — real JWT, supplied by withAdminAuth; absent when using
                 the demo-login fallback below.
   ============================================================ */
export default function KnowledgeBasePage({ auth: authProp, onSignOut, token }) {
  const { toasts, pushToast, dismiss } = useToasts();
  const { auth, usingDemoAuth, now, setDemoAuth, handleSignOut, role } = useAdminAuth(authProp, onSignOut, pushToast);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingestingId, setIngestingId] = useState(null);
  const [ingestingAll, setIngestingAll] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setArticles([]);
      setError("This demo login has no real backend session — sign in through the actual app to manage the real knowledge base.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listKbArticles(token);
      setArticles(data);
      setError(null);
    } catch (err) {
      setArticles([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (auth && role === "ADMIN") load();
  }, [auth, role, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(a => {
      const matchesQ = !q || a.title.toLowerCase().includes(q) || (a.tags || []).some(t => t.toLowerCase().includes(q));
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

  const handleCreate = async (form) => {
    setModalSubmitting(true);
    try {
      const created = await createKbArticle(token, { title: form.title, category: form.category, tags: form.tags, body: form.body });
      setArticles(list => [created, ...list]);
      setModal(null); setModalError("");
      pushToast(`Created "${created.title}" as a draft.`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleUpdate = async (form) => {
    setModalSubmitting(true);
    try {
      const updated = await updateKbArticle(token, modal.article.id, { title: form.title, category: form.category, tags: form.tags, body: form.body });
      setArticles(list => list.map(a => a.id === updated.id ? updated : a));
      setModal(null); setModalError("");
      pushToast(`Saved "${updated.title}" — marked for re-ingest.`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const ingestOne = async (id) => {
    setIngestingId(id);
    try {
      const updated = await ingestKbArticle(token, id);
      setArticles(list => list.map(a => a.id === id ? updated : a));
      pushToast(`"${updated.title}" marked as re-ingested.`);
    } catch (err) {
      pushToast(err.message, "error");
    } finally {
      setIngestingId(null);
    }
  };

  const ingestAll = async () => {
    setIngestingAll(true);
    try {
      const updated = await ingestAllKbArticles(token);
      setArticles(updated);
      pushToast("Re-ingested all articles.");
    } catch (err) {
      pushToast(err.message, "error");
    } finally {
      setIngestingAll(false);
    }
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
            <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex" }}>
                <StatChip label="Total articles" value={loading ? "…" : stats.total} />
                <StatDivider /><StatChip label="Published" value={loading ? "…" : stats.published} color={COLORS.green} />
                <StatDivider /><StatChip label="Needs re-ingest" value={loading ? "…" : stats.stale} color={COLORS.yellow} />
                <StatDivider /><StatChip label="Drafts" value={loading ? "…" : stats.draft} color={COLORS.greyDim} />
              </div>
              <button onClick={load} disabled={loading || !token} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "8px 14px", fontFamily: FONT, fontSize: 12.5, cursor: loading || !token ? "default" : "pointer", opacity: loading || !token ? 0.6 : 1 }}>
                <Icon name="refreshCw" size={13} /> {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ maxWidth: 1320, margin: "16px auto 0", padding: "0 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "rgba(198,53,39,0.1)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", fontFamily: FONT, fontSize: 13 }}>
                <span>{token ? `Couldn't load articles — ${error}` : error}</span>
                {token && (
                  <button onClick={load} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.white, borderRadius: 8, padding: "6px 12px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

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
                <button onClick={ingestAll} disabled={ingestingAll || !token || articles.length === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 9, padding: "0 14px", fontFamily: FONT, fontSize: 12.5, cursor: ingestingAll || !token || articles.length === 0 ? "default" : "pointer", opacity: ingestingAll || !token || articles.length === 0 ? 0.6 : 1 }}>
                  <Icon name="refreshCw" size={13} /> {ingestingAll ? "Re-ingesting…" : "Re-ingest all"}
                </button>
                <button onClick={() => { setModal({ mode: "create" }); setModalError(""); }} disabled={!token} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.white, color: COLORS.ink, border: "none", borderRadius: 999, padding: "0 16px", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, cursor: token ? "pointer" : "default", opacity: token ? 1 : 0.6 }}>
                  <Icon name="plus" size={14} /> New article
                </button>
              </div>
            </div>

            {!loading && filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
                <Icon name="bookOpen" size={26} color={COLORS.greyDim} />
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15 }}>{articles.length === 0 ? "No articles yet." : "No articles match these filters."}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(a => (
                  <div key={a.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <Icon name="bookOpen" size={18} color={COLORS.grey} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: COLORS.white }}>{a.title}</div>
                      <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.grey, marginTop: 3 }}>{a.category} · {(a.tags || []).join(", ") || "no tags"}</div>
                    </div>
                    <StatusChip status={a.status} />
                    <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, minWidth: 110 }}>
                      {a.lastIngestedAt ? `Ingested ${new Date(a.lastIngestedAt).toLocaleDateString()}` : "Never ingested"}
                    </div>
                    <button onClick={() => { setModal({ mode: "edit", article: a }); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: "pointer" }}>
                      <Icon name="pencil" size={12} /> Edit
                    </button>
                    <button onClick={() => ingestOne(a.id)} disabled={ingestingId === a.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "6px 11px", fontFamily: FONT, fontSize: 12, cursor: ingestingId === a.id ? "default" : "pointer", opacity: ingestingId === a.id ? 0.6 : 1 }}>
                      <Icon name="refreshCw" size={12} /> {ingestingId === a.id ? "Re-ingesting…" : "Re-ingest"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {modal && (
            <Modal title={modal.mode === "edit" ? "Edit article" : "New KB article"} onClose={() => !modalSubmitting && setModal(null)}>
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey, marginBottom: 16 }}>
                Saved for real now — but re-ingesting only updates this article's status here; it doesn't yet feed the assistant's actual answers (that part of the pipeline isn't wired up).
              </div>
              <ArticleForm
                initial={modal.mode === "edit" ? modal.article : null}
                onSubmit={modal.mode === "edit" ? handleUpdate : handleCreate}
                onCancel={() => setModal(null)}
                error={modalError}
                submitting={modalSubmitting}
              />
            </Modal>
          )}
        </Fragment>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
