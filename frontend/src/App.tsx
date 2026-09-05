import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { Home } from './features/landing';
import {
  AdminOverview, AdminTransactions, AdminMembers, AdminReports,
  AdminMonthlyPayments, AdminCartera, AdminSystem, AdminCategories, AdminJersey,
  AdminProveedores, AdminCompras, AdminInventario, AdminAsistencia,
} from './pages/admin';
import { SystemTab } from './pages/admin/AdminSystem';
import { PortalOverview, PortalPayments, PortalSettings } from './pages/portal';
import { AdminLayout, AdminPage as AdminPageType } from './features/admin/components/AdminLayout';
import { AppPage } from './types/index';

type Page = AppPage;
type AdminPage = AdminPageType;

// Vistas que ve el socio dentro del mismo AdminLayout, filtrado por rol.
type PortalPage = Extract<AdminPageType, 'overview' | 'my-payments' | 'settings'>;

function AppContent() {
  const { isAuthenticated, currentUser, register } = useAuth();
  const [currentPage,      setCurrentPage]      = useState<Page>('home');
  const [currentAdminPage, setCurrentAdminPage] = useState<AdminPage>('overview');
  const [currentPortalPage, setCurrentPortalPage] = useState<PortalPage>('overview');
  const [systemTab,        setSystemTab]        = useState<SystemTab>('club-data');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    // Sin router no hay reinicio de scroll: al pasar de la landing al registro
    // se conservaría la posición y el formulario se abriría por el footer.
    window.scrollTo(0, 0);
  };

  // Adaptador entre el formulario de registro y lo que espera la API: el
  // formulario recoge nombre y apellido, el backend quiere username y full_name.
  const handleRegister = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    const email = data.email.trim().toLowerCase();

    // El usuario se deriva del correo: la parte anterior a la arroba, en
    // minúsculas y sin caracteres que el backend no acepta.
    const username = email
      .split('@')[0]
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 50)
      // Si el correo no deja ningún carácter utilizable, se genera uno.
      || `socio${Date.now().toString(36)}`;

    const name = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

    // El tipo User llama al campo 'name', pero POST /api/auth/register lee
    // 'full_name'; se envían los dos para no depender de cuál mire cada lado.
    return register({
      username,
      email,
      password: data.password,
      name,
      full_name: name,
    } as Parameters<typeof register>[0]);
  };

  const handleAdminNavigate = (pageOrTab: string) => {
    // Los antiguos módulos "Datos del Club" y "Usuarios" ahora son pestañas
    // dentro de Configuración del Sistema; se conservan sus alias de navegación.
    const systemAliases: Record<string, SystemTab> = {
      'club-data': 'club-data',
      data:        'club-data',
      users:       'users',
    };

    if (pageOrTab in systemAliases) {
      setSystemTab(systemAliases[pageOrTab]);
      setCurrentAdminPage('system');
      return;
    }

    const validPages: AdminPage[] = [
      'overview', 'transactions', 'members', 'reports', 'categories',
      'system', 'monthly-payments', 'cartera', 'jersey',
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

  // Navegación del portal del socio: sólo acepta sus tres vistas.
  const handlePortalNavigate = (pageOrTab: string) => {
    const validPages: PortalPage[] = ['overview', 'my-payments', 'settings'];

    if (validPages.includes(pageOrTab as PortalPage)) {
      setCurrentPortalPage(pageOrTab as PortalPage);
    }
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
          case 'system':           return <AdminSystem          onNavigate={handleAdminNavigate} initialTab={systemTab} key={systemTab} />;
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

    // ── Socio (rol 'user') ───────────────────────────────────────────────────
    // Mismo AdminLayout que el administrador; el menú se filtra por rol dentro
    // del propio componente. Esconder elementos es sólo cosmético: la
    // autorización real la aplican requireAuth y el filtro por req.user.id.
    const renderPortalContent = () => {
      switch (currentPortalPage) {
        case 'overview':    return <PortalOverview onNavigate={handlePortalNavigate} />;
        case 'my-payments': return <PortalPayments onNavigate={handlePortalNavigate} />;
        case 'settings':    return <PortalSettings onNavigate={handlePortalNavigate} />;
      }
    };

    return (
      <AdminLayout
        currentPage={currentPortalPage}
        onNavigate={(page: AdminPageType) => handlePortalNavigate(page)}
      >
        {renderPortalContent()}
      </AdminLayout>
    );
  }

  // ── No autenticado ─────────────────────────────────────────────────────────
  switch (currentPage) {
    case 'forgot-password':
      return <ForgotPassword onNavigate={handleNavigate} />;
    case 'login':
      return <Login onNavigate={handleNavigate} />;
    case 'register':
      return <Register onNavigate={handleNavigate} onRegister={handleRegister} />;
    case 'home':
    default:
      return <Home onNavigate={handleNavigate} />;
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