import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as api from '../lib/api.js';

/* ============================================================
   Products, backed entirely by the real backend
   (GET/POST /api/products, GET/PUT/PATCH /api/products/{id}).
   No seed/mock data — `products` is whatever the backend last
   returned for the current search/category query.

   The backend's search endpoint only supports `q` and `category`
   as filters (see ProductController.search) — there's no stock-
   status filter server-side, so pages that need one (the catalog
   grid) apply it client-side over this real, already-fetched batch.
   That's a view filter over genuine records, not fabricated data.
   ============================================================ */

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ q, category } = {}) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch a generous batch (backend caps pagination at the `size` we
      // request) since sort/stock-status filtering happen client-side.
      const page = await api.listProducts(token, { q, category, size: 100 });
      setProducts(page.content);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addProduct = useCallback(async (form) => {
    const created = await api.createProduct(token, {
      sku: form.sku.trim(),
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
    });
    setProducts((list) => [created, ...list]);
    return created;
  }, [token]);

  const updateProduct = useCallback(async (id, form) => {
    const updated = await api.updateProduct(token, id, {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category,
    });
    setProducts((list) => list.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, [token]);

  // The backend's stock endpoint takes {stock, active} together (StockUpdateRequest)
  // — both fields must be sent on every call, whichever one actually changed.
  const updateStock = useCallback(async (id, stock, active) => {
    const updated = await api.updateProductStock(token, id, { stock, active });
    setProducts((list) => list.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, [token]);

  // Serves from the already-fetched list when possible; falls back to a
  // direct GET /api/products/{id} so a product page reached straight from
  // a URL doesn't depend on the catalog grid having been visited first.
  const getById = useCallback(async (id) => {
    const cached = products.find((p) => p.id === id);
    if (cached) return cached;
    return api.getProduct(token, id);
  }, [products, token]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );

  const value = useMemo(
    () => ({ products, loading, error, categories, refresh, addProduct, updateProduct, updateStock, getById }),
    [products, loading, error, categories, refresh, addProduct, updateProduct, updateStock, getById]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
