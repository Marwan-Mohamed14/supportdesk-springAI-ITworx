import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProducts } from "../../context/ProductsContext.jsx";
import { useOrders } from "../../context/OrdersContext.jsx";
import {
  COLORS, FONT, Icon, money, fmtDate, stockStatus, isPreOrderOnly, Modal, ProductForm,
  useToasts, Toasts, CategoryPill, RatingLine, ProductImageTile, iconBtnStyle,
} from "./product-shared.jsx";

/* ============================================================
   Product Detail — Amazon-style PDP
   ------------------------------------------------------------
   Routed at /products/:id. Everyone can browse and order/pre-order;
   the admin management panel (edit / stock / active toggle /
   operational detail) only renders for role === "ADMIN" — that
   used to live inline on every catalog card, now it's here instead
   so the browsing grid stays uncluttered.
   ============================================================ */

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { getById, updateProduct, updateStock, toggleActive } = useProducts();
  const { placeOrderFromProduct } = useOrders();
  const { toasts, pushToast, dismiss } = useToasts();

  const product = getById(id);
  const [qty, setQty] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [localStock, setLocalStock] = useState(product?.stock ?? 0);
  useEffect(() => { if (product) setLocalStock(product.stock); }, [product?.stock]);

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT, padding: "60px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Product not found.</div>
        <button onClick={() => navigate("/products")} style={{ background: "none", border: `1px solid ${COLORS.line}`, color: COLORS.grey, borderRadius: 8, padding: "8px 16px", fontFamily: FONT, cursor: "pointer" }}>
          ← Back to products
        </button>
      </div>
    );
  }

  const status = stockStatus(product);
  const preOrderOnly = isPreOrderOnly(product);
  const actingUser = user?.name || "You";

  const handleOrder = () => {
    placeOrderFromProduct(product, qty, actingUser);
    pushToast(preOrderOnly
      ? `Pre-order placed for "${product.name}" — you'll see it under Orders → Pre-Orders.`
      : `Order placed for "${product.name}" — you'll see it under Orders → Ordered.`);
    setTimeout(() => navigate("/orders"), 650);
  };

  const commitStock = (next) => {
    const clamped = Math.max(0, next);
    setLocalStock(clamped);
    updateStock(product.id, clamped);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.ink, color: COLORS.white, fontFamily: FONT }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px 60px" }}>
        <button onClick={() => navigate("/products")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.grey, fontFamily: FONT, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 22 }}>
          <Icon name="chevronLeft" size={15} /> Back to products
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 36 }}>
          <ProductImageTile category={product.category} size="100%" iconSize={80} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <CategoryPill category={product.category} />
              <h1 style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: COLORS.white, margin: "10px 0 0" }}>{product.name}</h1>
            </div>

            <RatingLine rating={product.rating} reviewCount={product.reviewCount} size={14} />

            <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: COLORS.white, fontVariantNumeric: "tabular-nums" }}>
              {money(product.price)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={status.icon} size={14} color={status.color} />
              <span style={{ fontFamily: FONT, fontSize: 13.5, color: status.color, fontWeight: 600 }}>{status.label}</span>
            </div>

            <p style={{ fontFamily: FONT, fontSize: 14, color: COLORS.grey, lineHeight: 1.6, margin: "4px 0", maxWidth: 520 }}>
              {product.description}
            </p>

            {!preOrderOnly && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.grey }}>Quantity</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={iconBtnStyle}><Icon name="minus" size={13} /></button>
                  <span style={{ fontFamily: FONT, fontSize: 14, width: 24, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={iconBtnStyle}><Icon name="plus" size={13} /></button>
                </div>
              </div>
            )}
            {preOrderOnly && (
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: COLORS.greyDim, fontStyle: "italic" }}>
                This item will ship once it's back in stock.
              </div>
            )}

            <button
              onClick={handleOrder}
              style={{
                alignSelf: "flex-start", marginTop: 6, display: "flex", alignItems: "center", gap: 8,
                border: "none", borderRadius: 10, padding: "13px 24px", fontFamily: FONT, fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                background: preOrderOnly ? COLORS.blue : COLORS.red, color: COLORS.white,
              }}
            >
              <Icon name="shoppingBag" size={16} color={COLORS.white} />
              {preOrderOnly ? "Pre-order this item" : "Add to order"}
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
                <button onClick={() => commitStock(localStock - 1)} style={iconBtnStyle}><Icon name="minus" size={13} /></button>
                <span style={{ fontFamily: FONT, fontSize: 14, width: 32, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{localStock}</span>
                <button onClick={() => commitStock(localStock + 1)} style={iconBtnStyle}><Icon name="plus" size={13} /></button>
              </div>
              <button onClick={() => toggleActive(product.id, !product.active)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: "pointer", border: `1px solid ${COLORS.line}`, background: product.active ? "rgba(49,180,86,0.12)" : "rgba(198,53,39,0.12)", color: product.active ? COLORS.green : COLORS.red, borderRadius: 999, padding: "7px 12px" }}>
                <Icon name={product.active ? "power" : "powerOff"} size={12} />
                {product.active ? "Active" : "Disabled"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 16px", fontFamily: FONT, fontSize: 12, color: COLORS.grey, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${COLORS.line}`, marginTop: 16, paddingTop: 14 }}>
              <span>SKU: <b style={{ color: COLORS.white }}>{product.sku}</b></span>
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
            onSubmit={(form) => { updateProduct(product.id, form); setEditOpen(false); pushToast("Product updated."); }}
            onCancel={() => setEditOpen(false)}
            error={editError}
          />
        </Modal>
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
