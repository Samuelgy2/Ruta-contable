import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { AdminOverview, AdminTransactions, AdminMembers, AdminReports, AdminCategories, AdminClubData, AdminSystem, AdminAttendance, AdminMonthlyPayments, AdminCartera, AdminJersey, AdminLockers, AdminPurchases, AdminHealthPolicies } from './pages/admin';
import { AdminLayout, AdminPage as AdminPageType } from './features/admin/components/AdminLayout';

type Page = 'home' | 'login' | 'register' | 'forgot-password';
type AdminPage = AdminPageType;

function AppContent() {
  const { isAuthenticated, currentUser, register } = useAuth(); // ← quitado register
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentAdminPage, setCurrentAdminPage] = useState<AdminPage>('overview');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAdminNavigate = (pageOrTab: string) => {
    const validPages: AdminPage[] = ['overview', 'transactions', 'members', 'reports', 'categories', 'club-data', 'system', 'attendance', 'monthly-payments', 'cartera', 'jersey', 'lockers', 'purchases', 'health-policies'];
    if (validPages.includes(pageOrTab as AdminPage)) {
      setCurrentAdminPage(pageOrTab as AdminPage);
      return;
    }
    
    const tabToPage: Record<string, AdminPage> = {
      overview: 'overview',
      transactions: 'transactions',
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

  if (isAuthenticated) {
    if (!currentUser) {
      return <Login onNavigate={handleNavigate} />;
    }
    
    if (currentUser.role === 'admin') {
      const renderAdminContent = () => {
        switch (currentAdminPage) {
          case 'overview':
            return <AdminOverview onNavigate={handleAdminNavigate}  />;
          case 'transactions':
            return <AdminTransactions onNavigate={handleAdminNavigate} />;
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
          onNavigate={(page: AdminPageType) => handleAdminNavigate(page)}
        >
          {renderAdminContent()}
        </AdminLayout>
      );
    }
    return <Login onNavigate={handleNavigate} />;
  }

  switch (currentPage) {
    case 'register':
  return <register onNavigate={handleNavigate} />;
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