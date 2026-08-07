import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import AppShell from './components/layout/AppShell.jsx';
import { withAdminAuth } from './components/admin/withAdminAuth.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/auth/login.jsx';
import Signup from './pages/auth/signup.jsx';
import OrdersPage from './pages/orders/orders.jsx';
import TicketsPage from './pages/tickets/tickets.jsx';
import ProductCatalogPage from './pages/products/catalog.jsx';
import ProductDetail from './pages/products/ProductDetail.jsx';
import AuditTrailPage from './pages/admin/audit.jsx';
import KnowledgeBasePage from './pages/admin/kb.jsx';
import MetricsPage from './pages/admin/metrics.jsx';
import RefundApprovalsPage from './pages/admin/refunds.jsx';

const MetricsWithAuth = withAdminAuth(MetricsPage);
const KnowledgeBaseWithAuth = withAdminAuth(KnowledgeBasePage);
const RefundsWithAuth = withAdminAuth(RefundApprovalsPage);
const AuditWithAuth = withAdminAuth(AuditTrailPage);

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute allowedRoles={["AGENT", "CUSTOMER"]}>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/products" element={<ProductCatalogPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/metrics" replace />} />
          <Route path="/admin/metrics" element={<MetricsWithAuth />} />
          <Route path="/admin/kb" element={<KnowledgeBaseWithAuth />} />
          <Route path="/admin/refunds" element={<RefundsWithAuth />} />
          <Route path="/admin/audit" element={<AuditWithAuth />} />
        </Route>
      </Routes>

      {isAuthenticated && <ChatWidget />}
    </>
  );
}

export default App;
