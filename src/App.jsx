import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/AuthContext';
import RoleGuard from '@/lib/RoleGuard';
import { supabaseMissing } from '@/api/supabase';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import StaffLayout from '@/components/layout/StaffLayout';

// Public pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OrderPage from '@/pages/Order';
import OrderSuccess from '@/pages/OrderSuccess';
// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminEvent from '@/pages/admin/AdminEvent';
import AdminMenu from '@/pages/admin/AdminMenu';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminStats from '@/pages/admin/AdminStats';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminEmailReminders from '@/pages/admin/AdminEmailReminders';

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
  if (supabaseMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-red-600">Configuration manquante</h1>
          <p className="text-gray-600 text-sm">
            Les variables d'environnement Supabase ne sont pas configurées.
          </p>
          <code className="block text-xs bg-gray-100 p-3 rounded text-left">
            VITE_SUPABASE_URL=...<br />
            VITE_SUPABASE_ANON_KEY=...
          </code>
          <p className="text-gray-500 text-xs">
            Ajoutez-les dans Vercel &rarr; Settings &rarr; Environment Variables, puis redéployez.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/success/:orderId" element={<OrderSuccess />} />
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
              <Route path="delivery" element={<StaffDelivery />} />
              <Route path="stats" element={<AdminStats />} />
              <Route path="reminders" element={<AdminEmailReminders />} />
              <Route path="users" element={<AdminUsers />} />
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
