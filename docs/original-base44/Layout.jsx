import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Menu, X, Home, Calendar, UtensilsCrossed, ShoppingBag, Truck, ChefHat, Mail, BarChart3, Users, History, MapPin, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import RealtimeNotifications from './components/notifications/RealtimeNotifications';
import AutomatedNotifications from './components/notifications/AutomatedNotifications';
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminPages = [
    { name: 'AdminAnalyticsDashboard', label: 'Tableau de bord', icon: TrendingUp },
    { name: 'AdminEvent', label: 'Événements', icon: Calendar },
    { name: 'AdminMenu', label: 'Menus', icon: UtensilsCrossed },
    { name: 'AdminOrders', label: 'Commandes', icon: ShoppingBag },
    { name: 'AdminDeliveryTracking', label: 'Suivi livraisons', icon: MapPin },
    { name: 'OrderHistory', label: 'Historique', icon: History },
    { name: 'AdminStats', label: 'Statistiques', icon: BarChart3 },
    { name: 'AdminEmailReminders', label: 'Rappels email', icon: Mail },
    { name: 'AdminUsers', label: 'Accès & droits', icon: Users }
  ];

  const staffPages = [
    { name: 'StaffPreparation', label: 'Préparation', icon: ChefHat },
    { name: 'Delivery', label: 'Livraison', icon: Truck }
  ];

  const isAdminPage = adminPages.some(p => p.name === currentPageName);
  const isStaffPage = staffPages.some(p => p.name === currentPageName);
  const showNav = isAdminPage || isStaffPage;

  if (!showNav) {
    return <>{children}</>;
  }

  const currentSection = isAdminPage ? 'admin' : 'staff';
  const navItems = isAdminPage ? adminPages : staffPages;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">MF</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Maison Félicien</h1>
              <p className="text-xs text-gray-500">{currentSection === 'admin' ? 'Admin' : 'Staff'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t bg-white">
            <Link
              to={createPageUrl('Order')}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Retour accueil</span>
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MF</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Maison Félicien</h1>
              <p className="text-xs text-gray-500">{currentSection === 'admin' ? 'Administration' : 'Personnel'}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to={createPageUrl('Order')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Retour accueil</span>
          </Link>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {currentSection === 'admin' ? 'Administration' : 'Personnel'}
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <RealtimeNotifications />
        <AutomatedNotifications />
        <Toaster />
        {children}
      </main>
      </div>
      );
      }