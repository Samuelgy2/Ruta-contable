import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  DollarSign, 
  Users, 
  FileText, 
  PieChart, 
  Folder, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  UsersRound,
  Receipt,
  Tags,
  FileBarChart
} from 'lucide-react';
import clubLogo from '../../images/logo/club-logo.png';

// Color verde del club
const CLUB_GREEN = '#10b981';

// Tipos de páginas del admin
export type AdminPage = 'overview' | 'transactions' | 'users' | 'members' | 'reports' | 'categories' | 'club-data' | 'system';

// Configuración del menú de navegación
const adminMenuItems = [
  { 
    id: 'overview', 
    label: 'Resumen', 
    icon: Home,
    section: 'resumen'
  },
  { 
    id: 'transactions', 
    label: 'Transacciones', 
    icon: DollarSign,
    section: 'resumen'
  },
  { 
    id: 'members', 
    label: 'Socios', 
    icon: Folder,
    section: 'socios'
  },
  { 
    id: 'reports', 
    label: 'Reportes', 
    icon: FileText,
    section: 'socios'
  },
  { 
    id: 'categories', 
    label: 'Categorías', 
    icon: PieChart,
    section: 'socios'
  },
  { 
    id: 'club-data', 
    label: 'Datos del Club', 
    icon: Building2,
    section: 'datos'
  },
  { 
    id: 'system', 
    label: 'Sistema', 
    icon: Settings,
    section: 'datos'
  },
] as const;

// Agrupar items por sección
const menuSections = {
  resumen: { title: 'RESUMEN', items: adminMenuItems.filter(item => item.section === 'resumen') },
  socios: { title: 'SOCIOS', items: adminMenuItems.filter(item => item.section === 'socios') },
  datos: { title: 'DATOS DEL CLUB', items: adminMenuItems.filter(item => item.section === 'datos') },
};

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}

export function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determinar si mostrar el nombre del admin (solo en overview/dashboard)
  const showAdminName = currentPage === 'overview';

  // Nombre del administrador hardcodeado como "Samuel Gutierrez"
  const adminName = 'Samuel Gutierrez';

  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
  };

  // Función para toggle de sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para cerrar menú móvil
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Botón de menú móvil */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white"
        style={{ backgroundColor: CLUB_GREEN }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen flex flex-col z-50
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[280px]' : 'w-[72px]'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          backgroundColor: 'white',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}
      >
        {/* Logo y toggle */}
        <div 
          className="flex items-center justify-between border-b"
          style={{ 
            padding: sidebarOpen ? '20px' : '20px 16px',
            minHeight: '80px',
            borderColor: '#e5e7eb'
          }}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <img 
                src={clubLogo} 
                alt="Ruta Contable" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-base font-bold m-0 whitespace-nowrap" style={{ color: '#1f2937' }}>
                  Ruta Contable
                </h1>
              </div>
            </div>
          )}
          
          {/* Botón de colapsar sidebar */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: sidebarOpen ? '#f3f4f6' : 'transparent',
              color: '#6b7280'
            }}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nombre del admin (solo en dashboard) */}
        {showAdminName && sidebarOpen && (
          <div 
            className="mx-3 mt-3 p-4 rounded-xl"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #d1fae5' }}
          >
            <p className="text-[11px] m-0 uppercase tracking-wider" style={{ color: '#6b7280' }}>
              Administrador
            </p>
            <p className="text-sm font-semibold m-0 flex items-center gap-2" style={{ color: '#1f2937' }}>
              {adminName}
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {Object.entries(menuSections).map(([sectionKey, section]) => (
            <div key={sectionKey} className="mb-4">
              {sidebarOpen && (
                <p 
                  className="text-[11px] font-semibold px-3 mb-2 uppercase tracking-wider"
                  style={{ color: '#9ca3af' }}
                >
                  {section.title}
                </p>
              )}
              <ul className="list-none p-0 m-0 flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = currentPage === item.id;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onNavigate(item.id as AdminPage);
                          closeMobileMenu();
                        }}
                        className={`
                          w-full p-3 rounded-xl border-none cursor-pointer flex items-center gap-3 transition-all
                          ${sidebarOpen ? 'justify-start' : 'justify-center'}
                        `}
                        style={{
                          backgroundColor: isActive ? CLUB_GREEN : 'transparent',
                          color: isActive ? 'white' : '#4b5563',
                        }}
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {sidebarOpen && (
                          <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>
                            {item.label}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer con logout */}
        <div className="p-4 border-t" style={{ borderColor: '#e5e7eb' }}>
          <button
            onClick={handleLogout}
            className={`
              w-full p-3 rounded-xl border-none cursor-pointer flex items-center gap-3 transition-colors
              ${sidebarOpen ? 'justify-start' : 'justify-center'}
            `}
            style={{ 
              backgroundColor: '#fef2f2',
              color: '#dc2626'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="min-h-screen p-6 transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? '280px' : '72px',
          backgroundColor: '#f9fafb'
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
