import { io } from 'socket.io-client';
import { toast } from 'sonner';

let socket;

export const initSocket = (token) => {
  // Cerrar la conexión existente si la hay
  if (socket) socket.disconnect();

  // Crear una nueva conexión
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true
  });

  // Manejadores de eventos generales
  socket.on('connect', () => {
    console.log('Conectado a Socket.IO');
    toast.success('Conexión en tiempo real establecida');
  });

  socket.on('connect_error', (error) => {
    console.error('Error de conexión Socket.IO:', error.message);
    toast.error(`Error de conexión: ${error.message}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('Desconectado de Socket.IO:', reason);
    if (reason === 'io server disconnect') {
      // Reconectar si el servidor desconectó
      socket.connect();
    }
  });

  return socket;
};

// Obtener la instancia actual del socket
export const getSocket = () => socket;

// Enviar mensaje de chat
export const sendChatMessage = (receptorId, mensaje) => {
  if (!socket || !socket.connected) {
    toast.error('No hay conexión en tiempo real');
    return false;
  }

  socket.emit('chat message', {
    receptorId,
    mensaje
  });
  
  return true;
};

// Suscribirse a nuevos mensajes
export const subscribeToMessages = (callback) => {
  if (!socket) return () => {};
  
  socket.on('chat message', callback);
  
  return () => {
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
    socket.disconnect();
    console.log('Socket desconectado manualmente');
  }
};
