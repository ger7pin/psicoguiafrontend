
/**
 * Servicio de usuarios actualizado para backend con Supabase
 * Unifica clientesService y psicologosService
 */
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Obtener token de autenticación actual
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

class UsuariosService {
  
  /**
   * Obtener perfil del usuario autenticado
   */
  static async obtenerPerfil() {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/usuarios/perfil`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error obteniendo perfil');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  static async actualizarPerfil(datosActualizados) {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/usuarios/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(datosActualizados)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error actualizando perfil');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar psicólogos disponibles
   */
  static async buscarPsicologos(filtros = {}) {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      // Construir query string con filtros
      const queryParams = new URLSearchParams();
      if (filtros.especialidad) queryParams.append('especialidad', filtros.especialidad);
      if (filtros.disponible_online !== undefined) queryParams.append('disponible_online', filtros.disponible_online);
      if (filtros.rating_minimo) queryParams.append('rating_minimo', filtros.rating_minimo);

      const url = `${API_BASE}/api/usuarios/psicologos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error buscando psicólogos');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error buscando psicólogos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener detalles de un psicólogo específico
   */
  static async obtenerPsicologo(psicologoId) {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/usuarios/psicologos/${psicologoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error obteniendo psicólogo');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error obteniendo psicólogo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Funciones de compatibilidad con código existente

/**
 * Obtener lista de clientes (para psicólogos)
 */
export const obtenerClientes = async () => {
  // Esta funcionalidad se maneja ahora a través de conversaciones
  console.warn('⚠️ obtenerClientes() deprecado - usar ChatService.obtenerConversaciones()');
  return {
    success: false,
    error: 'Función deprecada - usar ChatService.obtenerConversaciones()'
  };
};

/**
 * Obtener lista de psicólogos
 */
export const obtenerPsicologos = (filtros) => UsuariosService.buscarPsicologos(filtros);

/**
 * Obtener psicólogo por ID
 */
export const obtenerPsicologoPorId = (id) => UsuariosService.obtenerPsicologo(id);

/**
 * Actualizar cliente
 */
export const actualizarCliente = (datos) => UsuariosService.actualizarPerfil(datos);

/**
 * Actualizar psicólogo
 */
export const actualizarPsicologo = (datos) => UsuariosService.actualizarPerfil(datos);

export default UsuariosService;
