import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as api from '../lib/api.js';

/* ============================================================
   Orders, backed entirely by the real backend.

   GET /api/orders (a real, paginated, global list) exists but is
   staff-only (AGENT/ADMIN) - a CUSTOMER session gets a 403 from it.
   OrderService also never scopes getOrderById to the caller, so
   there's still no "what are my orders" query for a customer -
   only "here is order X" for an id they already have.

   So: staff hydrate straight from GET /api/orders. Customers keep
   the old workaround (not fabricated data - every field shown
   still comes straight from GET /api/orders/{id}): remember which
   order ids this browser has created or looked up, per signed-in
   user, in localStorage, and hydrate each one live from the
   backend. The "look up by id" affordance in the UI lets either
   role pull in an order this browser doesn't already know about.

   Also real: OrderService.isValidTransition only allows forward
   moves PLACED -> PAID -> SHIPPED -> DELIVERED. There is no
   cancellation path despite OrderStatus.CANCELLED existing as an
   enum value — any attempt to reach it is rejected server-side.
   ============================================================ */

const STORAGE_PREFIX = 'supportdesk.orders.';

export const NEXT_STATUS = { PLACED: 'PAID', PAID: 'SHIPPED', SHIPPED: 'DELIVERED' };

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}
function readTrackedIds(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeTrackedIds(userId, ids) {
  localStorage.setItem(storageKey(userId), JSON.stringify(ids));
}

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { token, user, isAuthenticated, role } = useAuth();
  const userId = user?.userId;
  const isStaff = role === 'AGENT' || role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hydrate = useCallback(async (ids) => {
    if (!token || ids.length === 0) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(ids.map((id) => api.getOrder(token, id).catch(() => null)));
      setOrders(results.filter(Boolean).reverse()); // newest tracked first
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // AGENT/ADMIN: a real list endpoint exists for staff (GET /api/orders), so
  // hydrate directly from it instead of the per-browser tracked-ids workaround.
  const hydrateStaff = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.listOrders(token);
      setOrders(result.content);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    if (isStaff) {
      hydrateStaff();
    } else if (userId) {
      hydrate(readTrackedIds(userId));
    } else {
      setOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId, isStaff, token]);

  const trackId = useCallback((id) => {
    if (!userId) return;
    const ids = readTrackedIds(userId);
    if (!ids.includes(id)) writeTrackedIds(userId, [...ids, id]);
  }, [userId]);

  // items: [{ productId, quantity }, ...] — matches CreateOrderRequest exactly,
  // so this supports both a single "Add to order" from the product page and a
  // multi-line manual order from the Orders page.
  const placeOrder = useCallback(async (items) => {
    const created = await api.createOrder(token, { userId, items });
    trackId(created.id);
    setOrders((prev) => [created, ...prev]);
    return created;
  }, [token, userId, trackId]);

  const lookupOrder = useCallback(async (id) => {
    const found = await api.getOrder(token, id);
    trackId(found.id);
    setOrders((prev) => (prev.some((o) => o.id === found.id) ? prev.map((o) => (o.id === found.id ? found : o)) : [found, ...prev]));
    return found;
  }, [token, trackId]);

  const advanceStatus = useCallback(async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) throw new Error('This order has no further forward status to advance to.');
    const updated = await api.updateOrderStatus(token, order.id, next);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    return updated;
  }, [token]);

  const value = useMemo(
    () => ({ orders, loading, error, placeOrder, lookupOrder, advanceStatus }),
    [orders, loading, error, placeOrder, lookupOrder, advanceStatus]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
