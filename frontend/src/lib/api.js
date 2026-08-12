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

/* ---------------- Users — /users ---------------- */
// GET /users — returns { id, name, email } for every registered user
export const listUsers = (token) => request('/users', { token });

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

// POST /tickets/create-and-assign  body: same as createTicket - also auto-picks
// the least-loaded agent and assigns the ticket to them in one step. Used by
// the chatbot's "Connect me with an agent" escalation (see ChatWidget.jsx).
export const createAndAssignTicket = (token, body) => request('/tickets/create-and-assign', { method: 'POST', body, token });

// POST /tickets/{id}/assign  body: {agentId}
export const assignTicket = (token, id, agentId) =>
    request(`/tickets/${id}/assign`, { method: 'POST', body: { agentId }, token });

// POST /tickets/{id}/escalate  body: {reason}
export const escalateTicket = (token, id, reason) =>
    request(`/tickets/${id}/escalate`, { method: 'POST', body: { reason }, token });

// POST /tickets/{id}/close  no body
export const closeTicket = (token, id) =>
    request(`/tickets/${id}/close`, { method: 'POST', token });

/* ---------------- Metrics — /api/metrics (ADMIN only) ---------------- */
// GET /api/metrics/summary -> { ticketsOpen, ticketsResolvedToday, avgResolutionMins, escalationRate }
export const getMetricsSummary = (token) => request('/api/metrics/summary', { token });

/* ---------------- Knowledge Base — /api/kb/articles (ADMIN only) ---------------- */
export const listKbArticles = (token) => request('/api/kb/articles', { token });
export const createKbArticle = (token, body) => request('/api/kb/articles', { method: 'POST', body, token });
export const updateKbArticle = (token, id, body) => request(`/api/kb/articles/${id}`, { method: 'PUT', body, token });
export const ingestKbArticle = (token, id) => request(`/api/kb/articles/${id}/ingest`, { method: 'POST', token });
export const ingestAllKbArticles = (token) => request('/api/kb/articles/ingest-all', { method: 'POST', token });

/* ---------------- Refunds — /api/refunds (ADMIN only) ---------------- */
export const listRefunds = (token) => request('/api/refunds', { token });
export const approveRefund = (token, id, note) =>
    request(`/api/refunds/${id}/approve`, { method: 'POST', body: { note: note ?? '' }, token });
export const rejectRefund = (token, id, note) =>
    request(`/api/refunds/${id}/reject`, { method: 'POST', body: { note: note ?? '' }, token });

/* ---------------- Audit Trail — /api/audit (ADMIN only) ---------------- */
// GET /api/audit?q=&action=&actor=&from=&to= — all params optional; the page
// currently fetches everything and filters client-side, but the backend
// supports server-side filtering too if that's ever needed.
export const listAuditEntries = (token, { q, action, actor, from, to } = {}) =>
    request(`/api/audit${toQueryString({ q, action, actor, from, to })}`, { token });

/* ---------------- Chatbot (RAG) — /api/notes ---------------- */
// POST /api/notes/ask  body: {question} -> returns a plain-text answer (not JSON),
// so this bypasses request()'s JSON-response handling.
export async function askChatbot(token, question, conversationId) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/notes/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question, conversationId }),
    });
  } catch {
    throw new ApiError('Could not reach the assistant. Please try again.', { status: 0 });
  }

  const text = await response.text();

  if (!response.ok) {
    // Auth/validation failures come back as ProblemDetail JSON; anything else
    // (e.g. an unhandled exception) comes back as plain text or an HTML error page.
    let message = `Request failed (${response.status})`;
    try {
      const data = JSON.parse(text);
      message = data?.detail || data?.title || message;
    } catch {
      if (text) message = text;
    }
    throw new ApiError(message, { status: response.status });
  }

  return text;
}