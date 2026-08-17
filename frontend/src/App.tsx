import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './features/auth/pages/Login';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import {
  AdminOverview, AdminTransactions, AdminMembers, AdminReports, AdminClubData,
  AdminMonthlyPayments, AdminCartera, AdminSystem, AdminCategories, AdminJersey,
  AdminProveedores, AdminCompras, AdminInventario, AdminAsistencia,
} from './pages/admin';
import { AdminLayout, AdminPage as AdminPageType } from './features/admin/components/AdminLayout';
import { AppPage } from './types/index';

type Page = AppPage;
type AdminPage = AdminPageType;

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();
  const [currentPage,      setCurrentPage]      = useState<Page>('home');
  const [currentAdminPage, setCurrentAdminPage] = useState<AdminPage>('overview');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAdminNavigate = (pageOrTab: string) => {
    const validPages: AdminPage[] = [
      'overview', 'transactions', 'members', 'reports', 'categories',
      'club-data', 'system', 'monthly-payments', 'cartera', 'jersey',
      'proveedores', 'compras', 'inventario', 'asistencia',
    ];

    if (validPages.includes(pageOrTab as AdminPage)) {
      setCurrentAdminPage(pageOrTab as AdminPage);
      return;
    }

    const tabToPage: Record<string, AdminPage> = {
      overview:          'overview',
      transactions:      'transactions',
      members:           'members',
      reports:           'reports',
      categories:        'categories',
      data:              'club-data',
      'monthly-payments':'monthly-payments',
      cartera:           'cartera',
      jersey:            'jersey',
      proveedores:       'proveedores',
      compras:           'compras',
      inventario:        'inventario',
      asistencia:        'asistencia',
    };

    const page = tabToPage[pageOrTab];
    if (page) setCurrentAdminPage(page);
  };

  // ── Autenticado ────────────────────────────────────────────────────────────
  if (isAuthenticated) {
    if (!currentUser) return <Login onNavigate={handleNavigate} />;

    if (currentUser.role === 'admin') {
      const renderAdminContent = () => {
        switch (currentAdminPage) {
          case 'overview': return <AdminOverview onNavigate={handleAdminNavigate} adminName={currentUser.name} />;
          case 'transactions':     return <AdminTransactions    onNavigate={handleAdminNavigate} />;
          case 'members':          return <AdminMembers         onNavigate={handleAdminNavigate} />;
          case 'reports':          return <AdminReports         onNavigate={handleAdminNavigate} />;
          case 'categories':       return <AdminCategories      onNavigate={handleAdminNavigate} />;
          case 'club-data':        return <AdminClubData        onNavigate={handleAdminNavigate} />;
          case 'system':           return <AdminSystem          onNavigate={handleAdminNavigate} />;
          case 'monthly-payments': return <AdminMonthlyPayments onNavigate={handleAdminNavigate} />;
          case 'cartera':          return <AdminCartera         onNavigate={handleAdminNavigate} />;
          case 'jersey':           return <AdminJersey          onNavigate={handleAdminNavigate} />;
          case 'proveedores':      return <AdminProveedores     onNavigate={handleAdminNavigate} />;
          case 'compras':          return <AdminCompras         onNavigate={handleAdminNavigate} />;
          case 'inventario':       return <AdminInventario      onNavigate={handleAdminNavigate} />;
          case 'asistencia':       return <AdminAsistencia      onNavigate={handleAdminNavigate} />;
        }
      };

      return (
        <AdminLayout
          currentPage={currentAdminPage}
          onNavigate={(page: AdminPageType) => handleAdminNavigate(page)}
        >
          {renderAdminContent()}
        </AdminLayout>
      );
    }

    return <Login onNavigate={handleNavigate} />;
  }

  // ── No autenticado ─────────────────────────────────────────────────────────
  switch (currentPage) {
    case 'forgot-password':
      return <ForgotPassword onNavigate={handleNavigate} />;
    case 'home':
    default:
      return <Login onNavigate={handleNavigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}