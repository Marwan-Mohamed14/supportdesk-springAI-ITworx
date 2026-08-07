import React, { useEffect, useMemo, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProducts } from "../../context/ProductsContext.jsx";
import {
  COLORS, FONT, CATEGORIES, Icon, money, stockStatus, Modal, ProductForm,
  useToasts, Toasts, CategoryPill, RatingLine, ProductImageTile, inputStyle,
} from "./product-shared.jsx";

/* ============================================================
   Product Catalog — browsing grid (Amazon-style)
   ------------------------------------------------------------
   Shopping-first: cards are pure browsing tiles (image, name,
   rating, price, stock) that lift slightly on hover and open the
   full product page (ProductDetail.jsx) on click. Inventory
   management (edit / stock / active toggle) lives there now,
   admin-only — this grid stays uncluttered for everyone.

   Backend contract (Spring):
     GET    /api/products?q=&category=&page=&size=&sort=
     POST   /api/products                body: {sku,name,price,category,stock}
   ProductsContext (context/ProductsContext.jsx) currently mocks this with
   localStorage-backed state; swap its internals for real fetch() calls
   once the backend endpoints exist — this page doesn't need to change.
   ============================================================ */

function ProductCard({ product, onOpen }) {
  const [hover, setHover] = useState(false);
  const status = stockStatus(product);
  return (
    <div
      onClick={() => onOpen(product.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: COLORS.panel, border: `1px solid ${hover ? COLORS.greyDim : COLORS.line}`, borderRadius: 16,
        padding: 16, display: "flex", flexDirection: "column", gap: 10, cursor: "pointer",
        opacity: product.active ? 1 : 0.72,
        transform: hover ? "scale(1.035) translateY(-2px)" : "scale(1) translateY(0)",
        boxShadow: hover ? "0 18px 34px rgba(0,0,0,.4)" : "none",
        transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      }}
    >
      <ProductImageTile category={product.category} />
      <div style={{ marginTop: 2 }}><CategoryPill category={product.category} /></div>
      <h3 style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 600, color: COLORS.white, margin: 0, lineHeight: 1.35, minHeight: 42 }}>
        {product.name}
      </h3>
      <RatingLine rating={product.rating} reviewCount={product.reviewCount} />
      <div style={{ fontFamily: FONT, fontSize: 21, fontWeight: 700, color: COLORS.white, fontVariantNumeric: "tabular-nums" }}>
        {money(product.price)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name={status.icon} size={12} color={status.color} />
        <span style={{ fontFamily: FONT, fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</span>
      </div>
    </div>
  );
}

export default function ProductCatalogPage() {
  const { role } = useAuth();
  const { products, addProduct } = useProducts();
  const navigate = useNavigate();
  const { toasts, pushToast, dismiss } = useToasts();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");

  const openProduct = (id) => navigate(`/products/${id}`);

  const stats = useMemo(() => {
    const inStock = products.filter(p => p.active && p.stock > 5).length;
    const low = products.filter(p => p.active && p.stock > 0 && p.stock <= 5).length;
    const out = products.filter(p => !p.active || p.stock <= 0).length;
    return { total: products.length, inStock, low, out, categories: new Set(products.map(p => p.category)).size };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCat = category === "All" || p.category === category;
      const matchesStock = stockFilter === "all" ? true : stockFilter === "in" ? p.active && p.stock > 5 : stockFilter === "low" ? p.active && p.stock > 0 && p.stock <= 5 : !p.active || p.stock <= 0;
      return matchesQ && matchesCat && matchesStock;
    });
    const [key, dir] = sortKey.split("-");
    list.sort((a, b) => {
      let v = 0;
      if (key === "name") v = a.name.localeCompare(b.name);
      if (key === "price") v = a.price - b.price;
      if (key === "stock") v = a.stock - b.stock;
      return dir === "desc" ? -v : v;
    });
    return list;
  }, [products, query, category, stockFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, category, stockFilter, sortKey]);

  const handleCreate = (form) => {
    if (products.some(p => p.sku.toLowerCase() === form.sku.trim().toLowerCase())) {
      setModalError(`409 Conflict — a product with sku "${form.sku.trim()}" already exists.`);
      pushToast(`SKU "${form.sku.trim()}" already exists — choose a different one.`, "error");
      return;
    }
    addProduct(form);
    setModalOpen(false); setModalError(""); pushToast("Product added.");
  };
  const clearFilters = () => { setQuery(""); setCategory("All"); setStockFilter("all"); };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <style>{`
        * { box-sizing: border-box; }
        .sdc-noscroll::-webkit-scrollbar { display: none; }
        .sdc-noscroll { scrollbar-width: none; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "20px 28px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <h1 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, margin: 0 }}>Browse products</h1>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: COLORS.grey, margin: "6px 0 16px" }}>
            Hardware, licences and accessories available to order through IT Procurement.
          </p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.line}`, padding: "16px 28px", overflowX: "auto" }} className="sdc-noscroll">
        <div style={{ display: "flex", maxWidth: 1320, margin: "0 auto" }}>
          <StatChip label="Total SKUs" value={stats.total} />
          <Divider /><StatChip label="Healthy stock" value={stats.inStock} color={COLORS.green} />
          <Divider /><StatChip label="Low stock" value={stats.low} color={COLORS.yellow} />
          <Divider /><StatChip label="Unavailable" value={stats.out} color={COLORS.red} />
          <Divider /><StatChip label="Categories" value={stats.categories} />
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 28px", display: "flex", gap: 24 }}>
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={15} color={COLORS.grey} style={{ position: "absolute", left: 10, top: 10 }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or SKU" style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.grey, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `2px solid ${COLORS.red}`, display: "inline-block", paddingBottom: 3 }}>Category</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {["All", ...CATEGORIES].map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{ textAlign: "left", background: category === c ? "rgba(198,53,39,0.14)" : "none", border: "none", color: category === c ? COLORS.red : COLORS.grey, fontFamily: FONT, fontSize: 13, fontWeight: category === c ? 600 : 400, padding: "6px 8px", borderRadius: 7, cursor: "pointer" }}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.grey, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `2px solid ${COLORS.red}`, display: "inline-block", paddingBottom: 3 }}>Stock status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {[["all", "All"], ["in", "Healthy"], ["low", "Low"], ["out", "Unavailable"]].map(([k, label]) => (
                <button key={k} onClick={() => setStockFilter(k)} style={{ textAlign: "left", background: stockFilter === k ? "rgba(198,53,39,0.14)" : "none", border: "none", color: stockFilter === k ? COLORS.red : COLORS.grey, fontFamily: FONT, fontSize: 13, fontWeight: stockFilter === k ? 600 : 400, padding: "6px 8px", borderRadius: 7, cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
          {(query || category !== "All" || stockFilter !== "all") && (
            <button onClick={clearFilters} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>Clear filters</button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: COLORS.grey }}>{filtered.length} {filtered.length === 1 ? "product" : "products"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="arrowUpDown" size={13} color={COLORS.grey} />
                <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "6px 9px", fontSize: 12.5 }}>
                  <option value="name-asc">Name (A–Z)</option>
                  <option value="price-asc">Price (low–high)</option>
                  <option value="price-desc">Price (high–low)</option>
                  <option value="stock-asc">Stock (low–high)</option>
                  <option value="stock-desc">Stock (high–low)</option>
                </select>
              </div>
              {role === "ADMIN" && (
                <button onClick={() => { setModalOpen(true); setModalError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.white, color: COLORS.ink, border: "none", borderRadius: 999, padding: "9px 16px", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                  <Icon name="plus" size={14} /> Add product
                </button>
              )}
            </div>
          </div>

          {pageItems.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "70px 0", border: `1px dashed ${COLORS.line}`, borderRadius: 16 }}>
              <Icon name="tag" size={28} color={COLORS.greyDim} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>No products match these filters.</div>
                <div style={{ fontSize: 12.5, color: COLORS.grey }}>Try a different search term or clear the filters.</div>
              </div>
              <button onClick={clearFilters} style={{ background: COLORS.red, border: "none", color: COLORS.white, borderRadius: 999, padding: "8px 16px", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Clear filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={openProduct} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 12, color: COLORS.grey, fontVariantNumeric: "tabular-nums" }}>Page {page} of {totalPages} · {filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ ...inputStyle, width: "auto", padding: "5px 8px", fontSize: 12 }}>
                  {[8, 12, 20].map(s => <option key={s} value={s}>{s} / page</option>)}
                </select>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...pageBtnStyle, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "default" : "pointer" }}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1).map((n, idx, arr) => (
                  <Fragment key={n}>
                    {idx > 0 && arr[idx - 1] !== n - 1 && <span style={{ color: COLORS.greyDim, fontSize: 12 }}>…</span>}
                    <button onClick={() => setPage(n)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: page === n ? COLORS.red : "none", color: page === n ? COLORS.white : COLORS.grey, fontFamily: FONT, fontSize: 12.5, cursor: "pointer", fontVariantNumeric: "tabular-nums" }}>{n}</button>
                  </Fragment>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...pageBtnStyle, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "default" : "pointer" }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Add product" onClose={() => setModalOpen(false)}>
          <ProductForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} error={modalError} />
        </Modal>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

const pageBtnStyle = { height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "none", color: COLORS.white, fontFamily: FONT, fontSize: 12, fontWeight: 600 };

function StatChip({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 18px" }}>
      <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: color || COLORS.white, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontFamily: FONT, fontSize: 11, color: COLORS.grey, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
function Divider() { return <div style={{ width: 1, background: COLORS.line, margin: "0 4px" }} />; }
