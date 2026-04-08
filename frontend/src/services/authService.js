import api from './api';

export const authService = {
  // Iniciar sesión con el backend
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response);
      if (response.data.success) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('clubfinance_token', response.data.data.token);
        localStorage.setItem('clubfinance_user', JSON.stringify(response.data.data.user));
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || 'Error de conexión' };
    }
  },

  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        localStorage.setItem('clubfinance_token', response.data.data.token);
        localStorage.setItem('clubfinance_user', JSON.stringify(response.data.data.user));
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.response?.data?.message || 'Error de registro' };
    }
  },

  // Verificar token (para mantener sesión)
  verify: async () => {
    const token = localStorage.getItem('clubfinance_token');
    if (!token) return null;
    
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      localStorage.removeItem('clubfinance_token');
      localStorage.removeItem('clubfinance_user');
      return null;
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('clubfinance_token');
    localStorage.removeItem('clubfinance_user');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('clubfinance_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('clubfinance_token');
  }
};