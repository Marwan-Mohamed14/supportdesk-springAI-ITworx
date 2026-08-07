import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as api from '../lib/api.js';
import { decodeJwtExpiry } from '../lib/jwt.js';

const STORAGE_KEY = 'supportdesk.auth';
const ROLE_PRECEDENCE = ['ADMIN', 'AGENT', 'CUSTOMER'];

// The four admin/product pages (built before real auth existed) expect a
// single primary role, not the raw roles array the backend returns.
function primaryRole(roles) {
  return ROLE_PRECEDENCE.find((r) => roles.includes(r)) ?? roles[0] ?? null;
}

function withExpiry(response) {
  return { ...response, expiresAt: decodeJwtExpiry(response.token) };
}

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const login = useCallback(async (email, password) => {
    const response = withExpiry(await api.login(email, password));
    setSession(response);
    persistSession(response);
    return response;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const response = withExpiry(await api.register(name, email, password));
    setSession(response);
    persistSession(response);
    return response;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    persistSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session,
      token: session?.token ?? null,
      roles: session?.roles ?? [],
      role: session ? primaryRole(session.roles ?? []) : null,
      expiresAt: session?.expiresAt ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      register,
      logout,
    }),
    [session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
