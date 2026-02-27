import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/AuthContext';
import RoleGuard from '@/lib/RoleGuard';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import StaffLayout from '@/components/layout/StaffLayout';

// Public pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OrderPage from '@/pages/Order';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEvent from '@/pages/admin/AdminEvent';
import AdminMenu from '@/pages/admin/AdminMenu';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminPlaceholder from '@/pages/admin/AdminPlaceholder';

// Staff pages
import StaffKitchen from '@/pages/staff/StaffKitchen';
import StaffDelivery from '@/pages/staff/StaffDelivery';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/order" element={<OrderPage />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminLayout />
                </RoleGuard>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="events" element={<AdminEvent />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="delivery" element={<AdminPlaceholder title="Suivi livraisons" phase="2" />} />
              <Route path="history" element={<AdminPlaceholder title="Historique" phase="3" />} />
              <Route path="stats" element={<AdminPlaceholder title="Statistiques" phase="4" />} />
              <Route path="reminders" element={<AdminPlaceholder title="Rappels email" phase="4" />} />
              <Route path="users" element={<AdminPlaceholder title="Accès & droits" phase="4" />} />
            </Route>

            {/* Staff */}
            <Route
              path="/staff"
              element={
                <RoleGuard allowedRoles={['admin', 'staff']}>
                  <StaffLayout />
                </RoleGuard>
              }
            >
              <Route path="kitchen" element={<StaffKitchen />} />
              <Route path="delivery" element={<StaffDelivery />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
