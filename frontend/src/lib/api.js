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

async function request(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Please try again.', { status: 0 });
  }

  const isJson = response.headers.get('content-type')?.includes('json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(data?.detail || data?.title || 'Something went wrong.', {
      status: response.status,
      fieldErrors: data?.errors,
    });
  }

  return data;
}

export const login = (email, password) => request('/api/auth/login', { email, password });

export const register = (name, email, password) =>
  request('/api/auth/register', { name, email, password });
