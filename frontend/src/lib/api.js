const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Mirrors the backend's RFC7807 ProblemDetail error shape (see
// GlobalExceptionHandler / SecurityExceptionHandling): { title, detail, errors? }.
export class ApiError extends Error {
  constructor(message, { status, fieldErrors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? null;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Please try again.', { status: 0 });
  }

  const isJson = response.headers.get('content-type')?.includes('json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      data?.detail || data?.title || `Request failed (${response.status})`,
      { status: response.status, fieldErrors: data?.errors }
    );
  }

  return data;
}

function toQueryString(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/* ---------------- Auth — POST /api/auth/** (public) ---------------- */
export const login = (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } });
export const register = (name, email, password) =>
  request('/api/auth/register', { method: 'POST', body: { name, email, password } });

/* ---------------- Products — /api/products ---------------- */
// GET /api/products?q=&category=&page=&size=&sort=
export const listProducts = (token, { q, category, page, size, sort } = {}) =>
  request(`/api/products${toQueryString({ q, category, page, size, sort })}`, { token });

// GET /api/products/{id}
export const getProduct = (token, id) => request(`/api/products/${id}`, { token });

// POST /api/products  body: {sku, name, price, category, stock} — ADMIN only
export const createProduct = (token, body) => request('/api/products', { method: 'POST', body, token });

// PUT /api/products/{id}  body: {name, price, category} — ADMIN only
export const updateProduct = (token, id, body) => request(`/api/products/${id}`, { method: 'PUT', body, token });

// PATCH /api/products/{id}/stock  body: {stock, active} — ADMIN only, both fields required together
export const updateProductStock = (token, id, body) => request(`/api/products/${id}/stock`, { method: 'PATCH', body, token });

/* ---------------- Orders — /api/orders ---------------- */
// POST /api/orders  body: {userId, items: [{productId, quantity}]}
export const createOrder = (token, body) => request('/api/orders', { method: 'POST', body, token });

// GET /api/orders/{id} — no ownership check on the backend; any authenticated user + a valid id works
export const getOrder = (token, id) => request(`/api/orders/${id}`, { token });

// PATCH /api/orders/{id}/status  body: {status}. Backend only allows forward transitions:
// PLACED -> PAID -> SHIPPED -> DELIVERED (no cancellation path exists despite the CANCELLED enum value).
export const updateOrderStatus = (token, id, status) =>
  request(`/api/orders/${id}/status`, { method: 'PATCH', body: { status }, token });

/* ---------------- Tickets — /tickets (note: NOT under /api on the backend) ---------------- */
// GET /tickets?status=&priority=&page=&size=&sort= — global list, not scoped to the caller
export const listTickets = (token, { status, priority, page, size, sort } = {}) =>
  request(`/tickets${toQueryString({ status, priority, page, size, sort })}`, { token });

// POST /tickets/create  body: {customerId, title, description, priority, orderId?}
export const createTicket = (token, body) => request('/tickets/create', { method: 'POST', body, token });

// POST /tickets/{id}/assign  body: {agentId}
export const assignTicket = (token, id, agentId) =>
  request(`/tickets/${id}/assign`, { method: 'POST', body: { agentId }, token });

// POST /tickets/{id}/escalate  body: {reason}
export const escalateTicket = (token, id, reason) =>
  request(`/tickets/${id}/escalate`, { method: 'POST', body: { reason }, token });
