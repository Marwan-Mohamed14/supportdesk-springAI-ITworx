import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProducts } from "../../context/ProductsContext.jsx";
import { useOrders } from "../../context/OrdersContext.jsx";
import {
  COLORS, FONT, Icon, money, fmtDate, stockStatus, canOrder, Modal, ProductForm,
  useToasts, Toasts, CategoryPill, ProductImageTile, iconBtnStyle,
} from "./product-shared.jsx";

/* ============================================================
   Product Detail — Amazon-style PDP, backed by the real backend.
   ------------------------------------------------------------
   Fetched directly by id (GET /api/products/{id}) rather than
   only trusting the catalog grid's cache, so a direct link works
   too. "Add to order" calls the real POST /api/orders — if the
   backend rejects it (out of stock / inactive), that real error
   is shown; there is no pre-order/backorder fallback because the
   backend has no such concept.

   The admin panel below (edit / stock / active toggle) is real:
   PUT /api/products/{id} and PATCH /api/products/{id}/stock.
   ============================================================ */

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Mounted at both /products/:id and /admin/products/:id (admin console,
  // same component reused) — keep internal links under whichever prefix.
  const basePath = location.pathname.startsWith("/admin") ? "/admin" : "";
  const { role } = useAuth();
  const { getById, updateProduct, updateStock } = useProducts();
  const { placeOrder } = useOrders();
  const { toasts, pushToast, dismiss } = useToasts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [qty, setQty] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getById(id)
      .then((p) => { if (!cancelled) setProduct(p); })
      .catch((err) => { if (!cancelled) setLoadError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.grey, fontFamily: FONT, padding: "60px 28px", textAlign: "center" }}>
        Loading product…
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT, padding: "60px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          {loadError ? `Couldn't load this product — ${loadError.message}` : "Product not found."}
        </div>
        <button onClick={() => navigate(`${basePath}/products`)} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "8px 16px", fontFamily: FONT, cursor: "pointer" }}>
          ← Back to products
        </button>
      </div>
    );
  }

  const status = stockStatus(product);
  const orderable = canOrder(product);

  const handleOrder = async () => {
    setOrdering(true);
    try {
      const order = await placeOrder([{ productId: product.id, quantity: qty }]);
      pushToast(`Order ${order.orderNumber} placed.`);
      setTimeout(() => navigate(`${basePath}/orders`), 650);
    } catch (err) {
      pushToast(err.message, "error");
      setOrdering(false);
    }
  };

  const commitStock = async (nextStock) => {
    const clamped = Math.max(0, nextStock);
    try {
      const updated = await updateStock(product.id, clamped, product.active);
      setProduct(updated);
    } catch (err) {
      pushToast(err.message, "error");
    }
  };

  const toggleActive = async () => {
    try {
      const updated = await updateStock(product.id, product.stock, !product.active);
      setProduct(updated);
    } catch (err) {
      pushToast(err.message, "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px 60px" }}>
        <button onClick={() => navigate(`${basePath}/products`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.grey, fontFamily: FONT, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 22 }}>
          <Icon name="chevronLeft" size={15} /> Back to products
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 36 }}>
          <ProductImageTile category={product.category} size="100%" iconSize={80} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <CategoryPill category={product.category || "Uncategorized"} />
              <h1 style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: COLORS.white, margin: "10px 0 0" }}>{product.name}</h1>
              <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.greyDim, marginTop: 4 }}>SKU {product.sku}</div>
            </div>

            <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: COLORS.white, fontVariantNumeric: "tabular-nums" }}>
              {money(Number(product.price))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={status.icon} size={14} color={status.color} />
              <span style={{ fontFamily: FONT, fontSize: 13.5, color: status.color, fontWeight: 600 }}>{status.label}</span>
            </div>

            {orderable ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey }}>Quantity</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={iconBtnStyle}><Icon name="minus" size={13} /></button>
                  <span style={{ fontFamily: FONT, fontSize: 14, width: 24, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={iconBtnStyle}><Icon name="plus" size={13} /></button>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.greyDim, fontStyle: "italic" }}>
                This product isn't orderable right now (out of stock or unavailable).
              </div>
            )}

            <button
              onClick={handleOrder}
              disabled={!orderable || ordering}
              style={{
                alignSelf: "flex-start", marginTop: 6, display: "flex", alignItems: "center", gap: 8,
                border: "none", borderRadius: 10, padding: "13px 24px", fontFamily: FONT, fontWeight: 700, fontSize: 14.5,
                cursor: orderable && !ordering ? "pointer" : "not-allowed",
                background: orderable ? COLORS.red : COLORS.panelHi, color: orderable ? COLORS.white : COLORS.greyDim,
              }}
            >
              <Icon name="shoppingBag" size={16} color={orderable ? COLORS.white : COLORS.greyDim} />
              {ordering ? "Placing order…" : "Add to order"}
            </button>
          </div>
        </div>

        {role === "ADMIN" && (
          <div style={{ marginTop: 40, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5 }}>Admin — inventory management</div>
              <button onClick={() => { setEditOpen(true); setEditError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "7px 12px", fontFamily: FONT, fontSize: 12.5, cursor: "pointer" }}>
                <Icon name="pencil" size={12} /> Edit name / price / category
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderTop: `1px solid ${COLORS.line}`, paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey }}>Stock</span>
                <button onClick={() => commitStock(product.stock - 1)} style={iconBtnStyle}><Icon name="minus" size={13} /></button>
                <span style={{ fontFamily: FONT, fontSize: 14, width: 32, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{product.stock}</span>
                <button onClick={() => commitStock(product.stock + 1)} style={iconBtnStyle}><Icon name="plus" size={13} /></button>
              </div>
              <button onClick={toggleActive} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer", border: `1px solid ${COLORS.line}`, background: product.active ? "rgba(49,180,86,0.12)" : "rgba(198,53,39,0.12)", color: product.active ? COLORS.green : COLORS.red, borderRadius: 999, padding: "7px 12px" }}>
                <Icon name={product.active ? "power" : "powerOff"} size={12} />
                {product.active ? "Active" : "Disabled"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 16px", fontFamily: FONT, fontSize: 12, color: COLORS.grey, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${COLORS.line}`, marginTop: 16, paddingTop: 14 }}>
              <span>Assigned: <b style={{ color: COLORS.white }}>{product.totalAssignedItems}</b></span>
              <span>Decommissioned: <b style={{ color: COLORS.white }}>{product.totalDecommissioned}</b></span>
              <span>Total units: <b style={{ color: COLORS.white }}>{product.totalUnits}</b></span>
              <span style={{ gridColumn: "1 / -1" }}>Created {fmtDate(product.createdAt)} · Modified {fmtDate(product.modifiedAt)}</span>
            </div>
          </div>
        )}
      </div>

      {editOpen && (
        <Modal title="Edit product" onClose={() => setEditOpen(false)}>
          <ProductForm
            initial={product}
            onSubmit={async (form) => {
              try {
                const updated = await updateProduct(product.id, form);
                setProduct(updated);
                setEditOpen(false);
                pushToast("Product updated.");
              } catch (err) {
                setEditError(err.message);
              }
            }}
            onCancel={() => setEditOpen(false)}
            error={editError}
          />
        </Modal>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
