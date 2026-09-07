import api from './api';

// ─── Tipos compartidos por el panel del admin y el portal ────────────────────
export type JerseyEstado = 'Solicitado' | 'En producción' | 'Listo' | 'Entregado' | 'Cancelado';

export const JERSEY_ESTADOS: JerseyEstado[] = ['Solicitado', 'En producción', 'Listo', 'Entregado', 'Cancelado'];

export interface JerseyCampana {
  id: number;
  titulo: string;
  descripcion: string | null;
  tallas: string[];
  valor: number;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
  createdBy: number | null;
  createdAt: string;
  totalPedidos?: number;
}

export interface JerseyPedido {
  id: number;
  idSocio: number;
  idCampana: number | null;
  socioNombre: string | null;
  socioDocumento: string | null;
  campanaTitulo: string | null;
  fecha: string;
  tipo: string;
  talla: string | null;
  aplique: string | null;
  estampado: string | null;
  cantidad: number;
  valor: number;
  estado: JerseyEstado;
  fechaEntrega: string | null;
  observaciones: string | null;
}

// Pedido del socio dentro de una campaña (forma reducida que devuelve el portal).
export interface PortalPedido {
  id: number;
  cantidad: number;
  talla: string | null;
  estampado: string | null;
  valor: number;
  estado: JerseyEstado;
  fecha: string;
  fechaEntrega: string | null;
}

export interface PortalCampana extends Omit<JerseyCampana, 'totalPedidos'> {
  pedido: PortalPedido | null;
}

export interface PortalJerseyData {
  vinculado: boolean;
  idSocio: number | null;
  campanas: PortalCampana[];
}

export interface FiltrosPedidos {
  campana?: number | string;
  estado?: string;
  search?: string;
}

export const jerseyService = {
  // ── Administrador ──────────────────────────────────────────────────────────
  getCampanas: async () => {
    const response = await api.get('/jersey/campanas');
    return response.data;
  },

  createCampana: async (data: {
    titulo: string; descripcion?: string; valor: number; tallas: string[]; fechaFin?: string | null;
  }) => {
    const response = await api.post('/jersey/campanas', data);
    return response.data;
  },

  // Editar o cerrar (activa: false).
  updateCampana: async (id: number, data: Partial<{
    titulo: string; descripcion: string; valor: number; tallas: string[]; fechaFin: string | null; activa: boolean;
  }>) => {
    const response = await api.put(`/jersey/campanas/${id}`, data);
    return response.data;
  },

  getPedidos: async (filtros: FiltrosPedidos = {}) => {
    const params = new URLSearchParams();
    if (filtros.campana) params.set('campana', String(filtros.campana));
    if (filtros.estado)  params.set('estado', filtros.estado);
    if (filtros.search)  params.set('search', filtros.search);
    const query = params.toString();
    const response = await api.get(`/jersey/pedidos${query ? `?${query}` : ''}`);
    return response.data;
  },

  createPedido: async (data: {
    idSocio: number; idCampana?: number | null; fecha?: string; tipo?: string; talla?: string;
    aplique?: string; estampado?: string; cantidad?: number; valor?: number; estado?: JerseyEstado;
    fechaEntrega?: string; observaciones?: string;
  }) => {
    const response = await api.post('/jersey/pedidos', data);
    return response.data;
  },

  updatePedido: async (id: number, data: Partial<{
    estado: JerseyEstado; fechaEntrega: string; observaciones: string; talla: string; estampado: string;
  }>) => {
    const response = await api.put(`/jersey/pedidos/${id}`, data);
    return response.data;
  },

  deletePedido: async (id: number) => {
    const response = await api.delete(`/jersey/pedidos/${id}`);
    return response.data;
  },

  // ── Portal del socio ───────────────────────────────────────────────────────
  getPortal: async () => {
    const response = await api.get('/portal/jersey');
    return response.data;
  },

  enviarPedidoPortal: async (data: { idCampana: number; cantidad: number; talla: string; estampado?: string }) => {
    const response = await api.post('/portal/jersey/pedidos', data);
    return response.data;
  },
};
