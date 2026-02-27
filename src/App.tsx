import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { AdminPanel } from './pages/AdminPanel';
import { AdminOverview, AdminTransactions, AdminUsers, AdminMembers, AdminReports, AdminCategories, AdminClubData, AdminSystem } from './pages/admin';
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

  // Navigation handler for admin pages - acepta string para compatibilidad con páginas existentes
  const handleAdminNavigate = (pageOrTab: string) => {
    const tabToPage: Record<string, AdminPage> = {
      overview: 'overview',
      transactions: 'transactions',
      users: 'users',
      members: 'members',
      reports: 'reports',
      categories: 'categories',
      data: 'club-data',
      system: 'system',
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
    return <AdminPanel />;
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
