
/**
 * Servicio de chat actualizado para Supabase Realtime
 * Reemplaza Socket.io + Firebase con Supabase unificado
 */
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

class ChatService {
  
  /**
   * Obtener conversaciones del usuario
   */
  static async obtenerConversaciones() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/mensajes/conversaciones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error obteniendo conversaciones');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error obteniendo conversaciones:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  static async obtenerMensajes(conversacionId, limite = 50, offset = 0) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(
        `${API_BASE}/api/mensajes/conversaciones/${conversacionId}/mensajes?limite=${limite}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Error obteniendo mensajes');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar mensaje
   */
  static async enviarMensaje(conversacionId, contenido, tipo = 'texto', archivo = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const formData = new FormData();
      formData.append('conversacionId', conversacionId);
      formData.append('contenido', contenido);
      formData.append('tipo', tipo);
      
      if (archivo) {
        formData.append('archivo', archivo);
      }

      const response = await fetch(
        `${API_BASE}/api/mensajes/conversaciones/${conversacionId}/mensajes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error('Error enviando mensaje');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Marcar mensaje como leído
   */
  static async marcarComoLeido(mensajeId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/mensajes/mensajes/${mensajeId}/leido`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error marcando mensaje como leído');
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error marcando mensaje como leído:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar indicador de escritura
   */
  static async actualizarIndicadorEscritura(conversacionId, escribiendo = true) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(
        `${API_BASE}/api/mensajes/conversaciones/${conversacionId}/escribiendo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ escribiendo })
        }
      );

      if (!response.ok) {
        throw new Error('Error actualizando indicador de escritura');
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando indicador de escritura:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Suscribirse a mensajes en tiempo real
   */
  static suscribirseAMensajes(conversacionId, onNuevoMensaje, onIndicadorEscritura) {
    // Suscripción a nuevos mensajes
    const mensajesSubscription = supabase
      .channel(`mensajes:${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`
        },
        (payload) => {
          console.log('📨 Nuevo mensaje recibido:', payload.new);
          if (onNuevoMensaje) {
            onNuevoMensaje(payload.new);
          }
        }
      )
      .subscribe();

    // Suscripción a indicadores de escritura
    const escrituraSubscription = supabase
      .channel(`escritura:${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'indicadores_escritura',
          filter: `conversacion_id=eq.${conversacionId}`
        },
        (payload) => {
          console.log('✍️ Indicador de escritura:', payload);
          if (onIndicadorEscritura) {
            onIndicadorEscritura(payload);
          }
        }
      )
      .subscribe();

    // Función para desuscribirse
    return () => {
      supabase.removeChannel(mensajesSubscription);
      supabase.removeChannel(escrituraSubscription);
    };
  }

  /**
   * Buscar mensajes en conversación
   */
  static async buscarMensajes(conversacionId, busqueda, limite = 20) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(
        `${API_BASE}/api/mensajes/conversaciones/${conversacionId}/buscar?q=${encodeURIComponent(busqueda)}&limite=${limite}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Error buscando mensajes');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error buscando mensajes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crear nueva conversación
   */
  static async crearConversacion(clienteId, psicologoId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/mensajes/conversaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          clienteId,
          psicologoId
        })
      });

      if (!response.ok) {
        throw new Error('Error creando conversación');
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error creando conversación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ChatService;
