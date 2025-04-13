import { io } from 'socket.io-client';
import { toast } from 'sonner';

let socket;

export const initSocket = (token) => {
  // Cerrar la conexión existente si la hay
  if (socket) {
    try {
      socket.disconnect();
      console.log('Socket previo desconectado');
    } catch (e) {
      console.warn('Error al desconectar socket anterior:', e);
    }
  }

  // Crear una nueva conexión
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  console.log('Conectando socket a:', BACKEND_URL);
  
  try {
    // Opciones de conexión mejoradas
    socket = io(BACKEND_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Manejadores de eventos generales
    socket.on('connect', () => {
      console.log('Conectado a Socket.IO');
      // Enviar autenticación manual si tenemos token
      if (token) {
        console.log('Enviando autenticación manual con token');
        socket.emit('authenticate', { token });
      }
      toast.success('Conexión en tiempo real establecida');
    });
    
    // Evento de autenticación exitosa
    socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('Autenticación socket exitosa, userId:', data.userId);
        toast.success('Autenticación completada');
      } else {
        console.warn('Fallo en autenticación socket:', data.error);
        toast.error(`Error de autenticación: ${data.error || 'Desconocido'}`);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión Socket.IO:', error.message);
      toast.error(`Error de conexión: ${error.message}`);
    });
    
    // Escuchar confirmaciones de mensajes enviados
    socket.on('message sent', (data) => {
      if (data.success) {
        console.log('Mensaje enviado correctamente, ID:', data.messageId);
      } else {
        console.error('Error al enviar mensaje:', data.error);
        toast.error(`Error al enviar: ${data.error || 'Desconocido'}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Desconectado de Socket.IO:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Reconectar si el servidor desconectó o se cerró el transporte
        console.log('Intentando reconectar...');
        setTimeout(() => {
          try {
            socket.connect();
          } catch (e) {
            console.error('Error al reconectar:', e);
          }
        }, 1000);
      }
    });
    
    // Registrar cualquier error general
    socket.on('error', (error) => {
      console.error('Error en socket:', error);
    });
    
    return socket;
  } catch (error) {
    console.error('Error al crear socket:', error);
    toast.error('No se pudo establecer conexión en tiempo real');
    return null;
  }

};

// Obtener la instancia actual del socket
export const getSocket = () => socket;

// Enviar mensaje de chat
export const sendChatMessage = (receptorId, mensaje) => {
  if (!socket) {
    console.warn('No hay instancia de socket inicializada');
    return false;
  }
  
  if (!socket.connected) {
    console.warn('Socket no conectado, intentando reconectar...');
    try {
      socket.connect();
    } catch (e) {
      console.error('Error al reconectar socket:', e);
      toast.error('No hay conexión en tiempo real');
      return false;
    }
  }

  try {
    // Formato correcto del mensaje para el backend
    socket.emit('chat message', {
      receptorId: String(receptorId),
      ...mensaje
    });
    
    console.log(`Mensaje emitido a ${receptorId}:`, mensaje.content?.substr(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('Error al enviar mensaje por socket:', error);
    toast.error('Error al enviar mensaje');
    return false;
  }
};

// Suscribirse a nuevos mensajes
export const subscribeToMessages = (callback) => {
  if (!socket) {
    console.warn('No hay socket iniciado para suscribirse a mensajes');
    return () => {};
  }
  
  console.log('Suscrito a eventos de mensajes de chat');
  socket.on('chat message', (data) => {
    console.log('Mensaje recibido:', data);
    callback(data);
  });
  
  return () => {
    console.log('Cancelando suscripción a mensajes');
    socket.off('chat message', callback);
  };
};

// Indicar al receptor que el usuario está escribiendo
export const sendTypingStatus = (receptorId, escribiendo = true) => {
  if (!socket || !socket.connected) return;
  
  if (escribiendo) {
    socket.emit('escribiendo', { receptorId });
  } else {
    socket.emit('dejoDeEscribir', { receptorId });
  }
};

// Suscribirse al estado de escritura de otros usuarios
export const subscribeToTypingStatus = (callback) => {
  if (!socket) return () => {};
  
  socket.on('usuarioEscribiendo', callback);
  
  return () => {
    socket.off('usuarioEscribiendo', callback);
  };
};

// Desconectar socket
export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
      console.log('Socket desconectado manualmente');
    } catch (error) {
      console.error('Error al desconectar socket:', error);
    }
  }
};

// Verificar estado de la conexión
export const isSocketConnected = () => {
  return socket && socket.connected;
};

// Forzar reconexión manual
export const reconnectSocket = (token) => {
  if (!socket) {
    return initSocket(token);
  }
  
  try {
    if (!socket.connected) {
      console.log('Intentando reconectar socket...');
      socket.connect();
      
      // Si tenemos token, enviar autenticación
      if (token) {
        socket.emit('authenticate', { token });
      }
    }
    return socket;
  } catch (error) {
    console.error('Error al reconectar:', error);
    return null;
  }
};
