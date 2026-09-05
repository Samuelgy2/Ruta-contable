import api from './api';

export const portalService = {
  // Totales del socio de la sesión. Si la cuenta no está vinculada a una ficha
  // de socio, el backend devuelve el resumen en ceros con vinculado: false.
  getResumen: async () => {
    const response = await api.get('/portal/resumen');
    return response.data;
  },

  // Pagos de la pasarela del usuario en sesión. El backend filtra por el
  // identificador del token, nunca por uno enviado desde el cliente.
  getPagos: async () => {
    const response = await api.get('/portal/pagos');
    return response.data;
  },

  // Datos del propio perfil. Para cambiar la contraseña hay que enviar también
  // currentPassword junto a newPassword.
  updatePerfil: async (data: {
    full_name?: string;
    email?: string;
    telefono?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const response = await api.put('/portal/perfil', data);
    return response.data;
  },
};
