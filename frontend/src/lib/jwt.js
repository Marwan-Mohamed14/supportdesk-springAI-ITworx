// Minimal JWT payload decoder - reads the "exp" claim only, does NOT verify
// the signature (the browser can't verify it anyway; the backend already
// did on issuance, and re-validates on every request). Used purely to
// display an accurate session-expiry time in the UI.
export function decodeJwtExpiry(token) {
  try {
    const payloadB64 = token.split('.')[1];
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
