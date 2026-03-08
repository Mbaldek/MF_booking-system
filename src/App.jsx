import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/AuthContext';
import RoleGuard from '@/lib/RoleGuard';
import { supabaseMissing } from '@/api/supabase';

// Layouts (always loaded — they wrap routes)
import AdminLayout from '@/components/layout/AdminLayout';
import StaffLayout from '@/components/layout/StaffLayout';

// Critical public pages — loaded immediately
import MainPage from '@/pages/MainPage';
import OrderPage from '@/pages/OrderPage';
import OrderSuccess from '@/pages/OrderSuccess';

// Lazy-loaded public pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const OrderPageLegacy = lazy(() => import('@/pages/Order'));
const CustomerOrders = lazy(() => import('@/pages/CustomerOrders'));
const OrderFunnelTest = lazy(() => import('@/pages/OrderFunnelTest'));
const MainPageTest = lazy(() => import('@/pages/MainPageTest'));
const ReservationPage = lazy(() => import('@/pages/ReservationPage'));
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminEvent = lazy(() => import('@/pages/admin/AdminEvent'));
const AdminMenu = lazy(() => import('@/pages/admin/AdminMenu'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminStats = lazy(() => import('@/pages/admin/AdminStats'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminEmailReminders = lazy(() => import('@/pages/admin/AdminEmailReminders'));
const AdminOperations = lazy(() => import('@/pages/admin/AdminOperations'));
const AdminRestaurant = lazy(() => import('@/pages/admin/AdminRestaurant'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));

// Lazy-loaded staff pages
const StaffKitchen = lazy(() => import('@/pages/staff/StaffKitchen'));
const StaffDelivery = lazy(() => import('@/pages/staff/StaffDelivery'));

// Public delivery confirmation (scanned QR — no auth required)
const DeliverPage = lazy(() => import('@/pages/DeliverPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function LazyFallback() {
  return (
    <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center">
      <div className="animate-pulse text-mf-rose font-display italic text-2xl">Maison Félicien</div>
    </div>
  );
}

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
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              {/* Public — critical */}
              <Route path="/" element={<MainPage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/order/success/:orderId" element={<OrderSuccess />} />

              {/* Public — lazy */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/my-orders" element={<CustomerOrders />} />
              <Route path="/reservation/:eventId" element={<ReservationPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/main-old" element={<MainPageTest />} />
              <Route path="/home-old" element={<HomePage />} />
              <Route path="/order-old" element={<OrderFunnelTest />} />
              <Route path="/order-legacy" element={<OrderPageLegacy />} />

              {/* Delivery QR scan — no auth required */}
              <Route path="/staff/deliver/:orderId" element={<DeliverPage />} />

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
                <Route path="operations" element={<AdminOperations />} />
                <Route path="stats" element={<AdminStats />} />
                <Route path="reminders" element={<AdminEmailReminders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="restaurant" element={<AdminRestaurant />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
