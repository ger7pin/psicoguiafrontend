
/**
 * Servicio de citas actualizado para backend con Supabase
 * Mantiene compatibilidad con componentes existentes
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

/**
 * Crear nueva cita
 */
export const crearCita = async (datos) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`${API_BASE}/api/citas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando cita');
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error creando cita:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener citas del usuario
 */
export const obtenerCitas = async (filtros = {}) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    // Construir query string con filtros
    const queryParams = new URLSearchParams();
    if (filtros.estado) queryParams.append('estado', filtros.estado);
    if (filtros.fecha_desde) queryParams.append('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) queryParams.append('fecha_hasta', filtros.fecha_hasta);

    const url = `${API_BASE}/api/citas${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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
      throw new Error(error.message || 'Error obteniendo citas');
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error obteniendo citas:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Actualizar estado de cita
 */
export const actualizarEstadoCita = async (citaId, nuevoEstado, motivo = null) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`${API_BASE}/api/citas/${citaId}/estado`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        estado: nuevoEstado,
        motivo
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error actualizando cita');
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error actualizando cita:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cancelar cita
 */
export const cancelarCita = async (citaId, motivo) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`${API_BASE}/api/citas/${citaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ motivo })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error cancelando cita');
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error cancelando cita:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener cita específica
 */
export const obtenerCita = async (citaId) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`${API_BASE}/api/citas/${citaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error obteniendo cita');
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error obteniendo cita:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar disponibilidad de psicólogo
 */
export const verificarDisponibilidad = async (psicologoId, fecha, duracion = 60) => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Usuario no autenticado');
    }

    const queryParams = new URLSearchParams({
      fecha,
      duracion: duracion.toString()
    });

    const response = await fetch(
      `${API_BASE}/api/citas/disponibilidad/${psicologoId}?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error verificando disponibilidad');
    }

    const result = await response.json();
    return {
      success: true,
      disponible: result.disponible,
      message: result.message
    };

  } catch (error) {
    console.error('❌ Error verificando disponibilidad:', error);
    return {
      success: false,
      disponible: false,
      error: error.message
    };
  }
};

// Funciones de compatibilidad con código existente
export const obtenerCitasCliente = obtenerCitas;
export const obtenerCitasPsicologo = obtenerCitas;
export const confirmarCita = (citaId) => actualizarEstadoCita(citaId, 'confirmada');
export const completarCita = (citaId) => actualizarEstadoCita(citaId, 'completada');
