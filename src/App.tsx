import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserDashboard } from './pages/UserDashboard';
import { AdminPanel } from './pages/AdminPanel';

type Page = 'home' | 'login' | 'register';

function AppContent() {
  const { isAuthenticated, currentUser, register } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Si está autenticado, mostrar el panel correspondiente
  if (isAuthenticated) {
    if (currentUser?.role === 'admin') {
      return <AdminPanel />;
    }
    return <UserDashboard />;
  }

  // Si no está autenticado, mostrar páginas públicas
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  switch (currentPage) {
    case 'login':
      return <Login onNavigate={handleNavigate} />;
    case 'register':
      return <Register onNavigate={handleNavigate} onRegister={register} />;
    case 'home':
    default:
      return <LandingPage onNavigate={handleNavigate} />;
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
