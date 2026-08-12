import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/* ============================================================
   Adapter for the 4 pre-existing admin pages (pages/admin/*.jsx),
   which were built against the shape:
     auth = { displayName, role: "AGENT"|"ADMIN", expiresAt } | null
     onSignOut()
   and fall back to their own demo login when `auth` is undefined.
   Wrapping them with this HOC supplies the real, signed-in
   identity instead, so their internals need no changes.
   ============================================================ */
export function withAdminAuth(PageComponent) {
  return function AdminAuthAdapter(props) {
    const { user, role, expiresAt, token, logout } = useAuth();
    const navigate = useNavigate();

    const auth = user ? { displayName: user.name, role, expiresAt } : null;
    const handleSignOut = () => {
      logout();
      navigate("/login", { replace: true });
    };

    // `token` is also forwarded (in addition to `auth`) so pages that need to
    // call a real backend endpoint - currently just metrics.jsx - can do so.
    // Pages that don't use it (kb/refunds/audit, still MOCK_MODE) just ignore it.
    return <PageComponent {...props} auth={auth} token={token} onSignOut={handleSignOut} />;
  };
}
