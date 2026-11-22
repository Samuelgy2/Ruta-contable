import api from './api';

async function enviar(ruta, cuerpo) {
  try {
    const response = await api.post(ruta, cuerpo);
    return response.data;
  } catch (error) {
    if (error.response?.data) return error.response.data;
    return { success: false, message: 'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.' };
  }
}

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

  // Registrar usuario. No inicia sesión: el backend responde 201 sin token y el
  // usuario debe entrar después por el formulario de acceso.
  // Registro en tres pasos: código al correo, verificación y formulario de
  // socio + cuenta. Devuelven el cuerpo del backend también en los errores
  // (message, errors, attemptsLeft, invalidated, codigo) para mostrarlos.
  solicitarCodigoRegistro: (email) => enviar('/auth/registro/solicitar-codigo', { email }),
  verificarCodigoRegistro: (email, otp) => enviar('/auth/registro/verificar-codigo', { email, otp }),
  register: (datos) => enviar('/auth/register', datos),

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