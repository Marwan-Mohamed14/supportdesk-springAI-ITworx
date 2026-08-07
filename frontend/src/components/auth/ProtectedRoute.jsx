import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Where a signed-in user belongs when they hit a section their role can't
// see — never /login (they're already authenticated, just in the wrong place).
function homeRouteForRole(role) {
  return role === 'ADMIN' ? '/admin' : '/products';
}

// allowedRoles is optional and unused unless a route wants to restrict by role,
// e.g. <ProtectedRoute allowedRoles={['ADMIN']}>.
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, roles, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.some((r) => roles.includes(r))) {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
