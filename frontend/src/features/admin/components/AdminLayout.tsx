// src/features/admin/components/AdminLayout.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import { 
  Home, DollarSign, FileText, PieChart, Folder, Settings,
  Menu, X, LogOut, Building2, ClipboardList, CreditCard,
  Wallet, Shirt, Lock, ShoppingCart, Heart,
} from 'lucide-react';
import { NotificationBell } from '../../../components/ui/NotificationBell';
import clubLogo from '../../../images/logo/club-logo.png';

const CLUB_GREEN = '#10b981';

export type AdminPage =
  | 'overview' | 'transactions' | 'members' | 'reports' | 'categories'
  | 'club-data' | 'system' |'monthly-payments' | 'cartera' | 'jersey'
  | 'proveedores' | 'compras' | 'inventario' | 'asistencia'

const adminMenuItems = [
  { id: 'overview',         label: 'Resumen',          icon: Home,          section: 'resumen' },
  { id: 'transactions',     label: 'Transacciones',    icon: DollarSign,    section: 'resumen' },
  { id: 'members',          label: 'Socios',           icon: Folder,        section: 'socios'  },
  { id: 'reports',          label: 'Reportes',         icon: FileText,      section: 'socios'  },
  { id: 'categories',       label: 'Categorías',       icon: Folder,        section: 'socios'  },
  { id: 'club-data',        label: 'Datos del Club',   icon: Building2,     section: 'datos'   },
  { id: 'system',           label: 'Configuración del Sistema', icon: Settings,      section: 'datos'   },
  { id: 'monthly-payments', label: 'Mensualidades',    icon: CreditCard,    section: 'gestión' },
  { id: 'cartera',          label: 'Cartera',          icon: Wallet,        section: 'gestión' },
  { id: 'proveedores',      label: 'Proveedores',      icon: Building2,     section: 'gestión' },
  { id: 'compras',          label: 'Compras',          icon: ShoppingCart,  section: 'gestión' },
  { id: 'inventario',       label: 'Inventario',       icon: Shirt,         section: 'gestión' },
  { id: 'jersey',           label: 'Jersey',           icon: Shirt,         section: 'gestión' },
  { id: 'asistencia',       label: 'Asistencia',       icon: ClipboardList, section: 'gestión' },
] as const;

const menuSections = {
  resumen: { title: 'RESUMEN',        items: adminMenuItems.filter(i => i.section === 'resumen') },
  socios:  { title: 'SOCIOS',         items: adminMenuItems.filter(i => i.section === 'socios')  },
  datos:   { title: 'DATOS DEL CLUB', items: adminMenuItems.filter(i => i.section === 'datos')   },
  gestión: { title: 'GESTIÓN',        items: adminMenuItems.filter(i => i.section === 'gestión') },
};

interface AdminLayoutProps {
  children:    React.ReactNode;
  currentPage: AdminPage;
  onNavigate:  (page: AdminPage) => void;
}

export function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const { logout, currentUser } = useAuth();
  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth,      setWindowWidth]      = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop  = windowWidth >= 1024;
  const isExpanded = isMobileMenuOpen || (isDesktop && sidebarOpen);
  const sidebarW   = isExpanded ? '280px' : '64px';
 const adminName = currentUser?.name ?? 'Usuario';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleSidebar   = () =>
    isDesktop ? setSidebarOpen(p => !p) : setIsMobileMenuOpen(p => !p);

  return (
    <div className="admin-layout">

      {/* Botón menú móvil */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white"
        style={{ backgroundColor: CLUB_GREEN }}
        onClick={() => setIsMobileMenuOpen(p => !p)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay móvil */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside style={{
        position:   'fixed', top: 0, left: 0,
        height:     '100vh', width: sidebarW,
        backgroundColor: 'white',
        boxShadow:  '2px 0 10px rgba(0,0,0,0.1)',
        display:    'flex', flexDirection: 'column',
        overflow:   'hidden',
        transition: 'width 300ms ease, transform 300ms ease',
        transform:  !isDesktop && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
        zIndex:     50,
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          padding:    isExpanded ? '20px' : '12px',
          minHeight:  '72px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}
            onClick={toggleSidebar}>
            <img src={clubLogo} alt="Ruta Contable"
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} />
            {isExpanded && (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap' }}>
                Ruta Contable
              </span>
            )}
          </div>
        </div>

        {/* Card gestor */}
        {currentPage === 'overview' && isExpanded && (
          <div style={{
            margin: '12px', padding: '12px 16px', borderRadius: 12,
            backgroundColor: '#f0fdf4', border: '1px solid #d1fae5', flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
              Gestor
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
              {adminName}
            </p>
          </div>
        )}

        {/* Navegación */}
        <nav style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px',
          scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent',
        }}>
          {Object.entries(menuSections).map(([key, section]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              {isExpanded && (
                <p style={{
                  margin: '0 0 6px 12px', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af',
                }}>
                  {section.title}
                </p>
              )}
              {!isExpanded && (
                <div style={{ height: 1, backgroundColor: '#f3f4f6', margin: '4px 8px 8px' }} />
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(item => {
                  const isActive = currentPage === item.id;
                  const Icon     = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => { onNavigate(item.id as AdminPage); closeMobileMenu(); }}
                        title={!isExpanded ? item.label : undefined}
                        style={{
                          width:           '100%',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  isExpanded ? 'flex-start' : 'center',
                          gap:             isExpanded ? 10 : 0,
                          padding:         isExpanded ? '8px 12px' : '7px',
                          borderRadius:    10,
                          border:          'none',
                          cursor:          'pointer',
                          backgroundColor: isActive ? CLUB_GREEN : 'transparent',
                          color:           isActive ? 'white' : '#4b5563',
                          transition:      'background-color 150ms',
                        }}
                      >
                        <Icon size={isExpanded ? 20 : 17} style={{ flexShrink: 0 }} />
                        {isExpanded && (
                          <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
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

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
          <button
            onClick={logout}
            title={!isExpanded ? 'Cerrar Sesión' : undefined}
            style={{
              width:           '100%',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  isExpanded ? 'flex-start' : 'center',
              gap:             isExpanded ? 10 : 0,
              padding:         isExpanded ? '8px 12px' : '7px',
              borderRadius:    10, border: 'none', cursor: 'pointer',
              backgroundColor: '#fef2f2', color: '#dc2626',
            }}
          >
            <LogOut size={isExpanded ? 20 : 17} />
            {isExpanded && <span style={{ fontSize: 13, fontWeight: 500 }}>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <main style={{
        minHeight:   '100vh',
        marginLeft:  isDesktop ? sidebarW : '64px',
        marginTop:   isDesktop ? 0 : '60px',
        backgroundColor: '#f9fafb',
        transition:  'margin-left 300ms ease',
      }}>

        {/* ── Topbar con campana ────────────────────────────── */}
        <div style={{
          position:        'sticky', top: 0, zIndex: 40,
          backgroundColor: 'white',
          borderBottom:    '1px solid #e5e7eb',
          padding:         '0 24px',
          height:          '60px',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'flex-end',
          gap:             '12px',
          boxShadow:       '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Nombre admin */}
          <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
            {adminName}
          </span>

          {/* Separador */}
          <div style={{ width: '1px', height: '20px', background: '#e5e7eb' }} />

          {/* 🔔 Campana de notificaciones */}
          <NotificationBell />
        </div>

        {/* Contenido de la página */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;