
'use client';
import { useState, useEffect, useRef } from 'react';
import ChatService from '@/services/chatService';
import useAuthUser from '@/hooks/useAuthUser';

/**
 * Componente de Chat actualizado para Supabase Realtime
 * ELIMINA: Socket.io + Firebase Firestore (problemático)
 * IMPLEMENTA: Supabase Realtime (escalable)
 */
const Chat = ({ conversacionId, className = '' }) => {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [indicadorEscritura, setIndicadorEscritura] = useState(null);
  const [error, setError] = useState(null);
  
  const mensajesRef = useRef(null);
  const timeoutEscritura = useRef(null);
  const unsubscribeRef = useRef(null);
  
  const { usuario, isAuthenticated } = useAuthUser();

  // Cargar mensajes iniciales
  useEffect(() => {
    if (!conversacionId || !isAuthenticated) return;

    const cargarMensajes = async () => {
      setCargando(true);
      setError(null);

      const resultado = await ChatService.obtenerMensajes(conversacionId);
      
      if (resultado.success) {
        setMensajes(resultado.data);
      } else {
        setError(resultado.error);
      }
      
      setCargando(false);
    };

    cargarMensajes();
  }, [conversacionId, isAuthenticated]);

  // Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!conversacionId || !isAuthenticated) return;

    console.log('🔄 Suscribiéndose a chat en tiempo real:', conversacionId);

    const unsubscribe = ChatService.suscribirseAMensajes(
      conversacionId,
      // Callback para nuevos mensajes
      (nuevoMensaje) => {
        setMensajes(prev => {
          // Evitar duplicados
          const existe = prev.some(m => m.id === nuevoMensaje.id);
          if (existe) return prev;
          
          return [...prev, nuevoMensaje];
        });

        // Marcar como leído si no es nuestro mensaje
        if (nuevoMensaje.remitente_id !== usuario?.id) {
          ChatService.marcarComoLeido(nuevoMensaje.id);
        }

        // Scroll automático
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      },
      // Callback para indicadores de escritura
      (payload) => {
        if (payload.new && payload.new.usuario_id !== usuario?.id) {
          setIndicadorEscritura(payload.new.escribiendo ? payload.new : null);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversacionId, isAuthenticated, usuario?.id]);

  // Scroll automático al final
  const scrollToBottom = () => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  };

  // Manejar envío de mensaje
  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || enviando) return;

    setEnviando(true);
    setError(null);

    // Detener indicador de escritura
    await ChatService.actualizarIndicadorEscritura(conversacionId, false);

    const resultado = await ChatService.enviarMensaje(
      conversacionId,
      nuevoMensaje.trim()
    );

    if (resultado.success) {
      setNuevoMensaje('');
      // El mensaje aparecerá automáticamente via real-time subscription
    } else {
      setError(resultado.error);
    }

    setEnviando(false);
  };

  // Manejar indicador de escritura
  const handleInputChange = async (e) => {
    setNuevoMensaje(e.target.value);

    // Enviar indicador de escritura
    if (!escribiendo) {
      setEscribiendo(true);
      await ChatService.actualizarIndicadorEscritura(conversacionId, true);
    }

    // Limpiar timeout anterior
    if (timeoutEscritura.current) {
      clearTimeout(timeoutEscritura.current);
    }

    // Detener indicador después de 2 segundos de inactividad
    timeoutEscritura.current = setTimeout(async () => {
      setEscribiendo(false);
      await ChatService.actualizarIndicadorEscritura(conversacionId, false);
    }, 2000);
  };

  // Formatear fecha del mensaje
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const esHoy = date.toDateString() === ahora.toDateString();
    
    if (esHoy) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Debes iniciar sesión para usar el chat</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando chat...</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-800">Chat</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">En línea</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div 
        ref={mensajesRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96"
      >
        {mensajes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No hay mensajes aún</p>
            <p className="text-sm">¡Envía el primer mensaje!</p>
          </div>
        ) : (
          mensajes.map((mensaje) => {
            const esMio = mensaje.remitente_id === usuario?.id;
            
            return (
              <div
                key={mensaje.id}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    esMio
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{mensaje.contenido}</p>
                  <p
                    className={`text-xs mt-1 ${
                      esMio ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatearFecha(mensaje.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Indicador de escritura */}
        {indicadorEscritura && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">escribiendo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Input de mensaje */}
      <form onSubmit={handleEnviarMensaje} className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={!nuevoMensaje.trim() || enviando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {enviando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
