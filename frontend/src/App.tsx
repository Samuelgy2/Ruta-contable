import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { AdminOverview, AdminTransactions, AdminUsers, AdminMembers, AdminReports, AdminCategories, AdminClubData, AdminSystem, AdminAttendance, AdminMonthlyPayments, AdminCartera, AdminJersey, AdminLockers, AdminPurchases, AdminHealthPolicies } from './pages/admin';
import { AdminLayout, AdminPage as AdminPageType } from './features/admin/components/AdminLayout';

type Page = 'home' | 'login' | 'register' | 'forgot-password';
type AdminPage = AdminPageType;

function AppContent() {
  const { isAuthenticated, currentUser, register } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentAdminPage, setCurrentAdminPage] = useState<AdminPage>('overview');

  // Navigation handler for non-admin pages
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  // Navigation handler for admin pages - accepts both tab names and page IDs
  const handleAdminNavigate = (pageOrTab: string) => {
    // First check if it's already a valid page ID
    const validPages: AdminPage[] = ['overview', 'transactions', 'users', 'members', 'reports', 'categories', 'club-data', 'system', 'attendance', 'monthly-payments', 'cartera', 'jersey', 'lockers', 'purchases', 'health-policies'];
    if (validPages.includes(pageOrTab as AdminPage)) {
      setCurrentAdminPage(pageOrTab as AdminPage);
      return;
    }
    
    // Otherwise, map tab names to page IDs
    const tabToPage: Record<string, AdminPage> = {
      overview: 'overview',
      transactions: 'transactions',
      users: 'users',
      members: 'members',
      reports: 'reports',
      categories: 'categories',
      data: 'club-data',
      system: 'system',
      attendance: 'attendance',
      'monthly-payments': 'monthly-payments',
      cartera: 'cartera',
      jersey: 'jersey',
      lockers: 'lockers',
      purchases: 'purchases',
      'health-policies': 'health-policies',
    };
    const page = tabToPage[pageOrTab];
    if (page) {
      setCurrentAdminPage(page);
    }
  };

  // Si está autenticado, mostrar el panel correspondiente
  if (isAuthenticated) {
    // Si está autenticado pero no tiene usuario válido, mostrar login
    if (!currentUser) {
      return <Login onNavigate={handleNavigate} />;
    }
    
    if (currentUser.role === 'admin') {
      // Render admin pages with AdminLayout
      const renderAdminContent = () => {
        switch (currentAdminPage) {
          case 'overview':
            return <AdminOverview onNavigate={handleAdminNavigate} />;
          case 'transactions':
            return <AdminTransactions onNavigate={handleAdminNavigate} />;
          case 'users':
            return <AdminUsers onNavigate={handleAdminNavigate} />;
          case 'members':
            return <AdminMembers onNavigate={handleAdminNavigate} />;
          case 'reports':
            return <AdminReports onNavigate={handleAdminNavigate} />;
          case 'categories':
            return <AdminCategories onNavigate={handleAdminNavigate} />;
          case 'club-data':
            return <AdminClubData onNavigate={handleAdminNavigate} />;
          case 'system':
            return <AdminSystem onNavigate={handleAdminNavigate} />;
          // New modules
          case 'attendance':
            return <AdminAttendance onNavigate={handleAdminNavigate} />;
          case 'monthly-payments':
            return <AdminMonthlyPayments onNavigate={handleAdminNavigate} />;
          case 'cartera':
            return <AdminCartera onNavigate={handleAdminNavigate} />;
          case 'jersey':
            return <AdminJersey onNavigate={handleAdminNavigate} />;
          case 'lockers':
            return <AdminLockers onNavigate={handleAdminNavigate} />;
          case 'purchases':
            return <AdminPurchases onNavigate={handleAdminNavigate} />;
          case 'health-policies':
            return <AdminHealthPolicies onNavigate={handleAdminNavigate} />;
          default:
            return <AdminOverview onNavigate={handleAdminNavigate} />;
        }
      };

      return (
        <AdminLayout 
          currentPage={currentAdminPage} 
          onNavigate={handleAdminNavigate}
        >
          {renderAdminContent()}
        </AdminLayout>
      );
    }
    return <Login onNavigate={handleNavigate} />;
  }

  // Si no está autenticado, mostrar páginas públicas
  switch (currentPage) {
    case 'register':
      return <Register onNavigate={handleNavigate} onRegister={register} />;
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
