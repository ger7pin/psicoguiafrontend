import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendChatMessage } from '../utils/socketService';

export const initializeChat = async (clienteId, psicologoId) => {
  try {
    // Verificar que los IDs existan
    if (!clienteId || !psicologoId) {
      console.error('Error: clienteId o psicologoId inválidos', { clienteId, psicologoId });
      return `${clienteId || 'unknown'}_${psicologoId || 'unknown'}`;
    }
    
    // Garantizar que el ID sea seguro para rutas y Firestore
    // Convertir explícitamente a string y manejar valores null/undefined
    const clienteIdStr = String(clienteId).replace(/[/.]/g, '_');
    const psicologoIdStr = String(psicologoId).replace(/[/.]/g, '_');
    const chatId = `${clienteIdStr}_${psicologoIdStr}`;
    console.log('Usando ID de chat:', chatId);
    
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef).catch(err => {
      console.error('Error al obtener documento de chat:', err);
      return { exists: () => false };
    });
  
    if (!chatDoc.exists()) {
      console.log('Creando nuevo documento de chat');
      try {
        await setDoc(chatRef, {
          participants: [clienteIdStr, psicologoIdStr],
          clienteId: clienteIdStr,
          psicologoId: psicologoIdStr,
          lastMessage: {
            content: "Inicio de conversación",
            timestamp: serverTimestamp(),
            senderId: "sistema"
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('Documento de chat creado exitosamente');
      } catch (error) {
        console.error('Error al crear documento de chat:', error);
      }
    }
    
    return chatId;
  } catch (error) {
    console.error('Error general en initializeChat:', error);
    // Devolver un ID de respaldo en caso de error
    return `${clienteId || 'unknown'}_${psicologoId || 'unknown'}`;
  }
};

export const updateChatMessage = async (chatId, message) => {
  const chatRef = doc(db, 'chats', chatId);
  
  // Actualizar el documento en Firebase
  await updateDoc(chatRef, {
    lastMessage: {
      content: message.content,
      timestamp: serverTimestamp(),
      senderId: message.senderId
    },
    updatedAt: serverTimestamp()
  });
};

export const enviarMensaje = async (chatId, mensaje, receptorId, emisorId) => {
  try {
    if (!receptorId) {
      console.error('Error: receptorId es requerido para enviar mensajes');
      return false;
    }
    
    // Convertir IDs a string si no lo son
    const receptorIdStr = String(receptorId);
    const emisorIdStr = emisorId ? String(emisorId) : 'unknown';
    
    console.log(`Enviando mensaje a ${receptorIdStr} desde ${emisorIdStr}`);
    
    // Enviar mensaje a través de Socket.io para comunicación en tiempo real
    const mensajeData = {
      chatId, 
      content: mensaje,
      senderId: emisorIdStr,
      receptorId: receptorIdStr,  // Asegurar que receptorId esté incluido
      timestamp: new Date().toISOString()
    };
    
    const enviado = sendChatMessage(receptorIdStr, mensajeData);
    
    // Si no se pudo enviar mediante socket, intentar guardar solo en Firebase
    if (!enviado) {
      console.warn('Socket desconectado, intentando guardar en Firebase');
      // No podemos actualizar Firestore si no tenemos un chatId válido
      if (!chatId) return false;
      
      try {
        // Actualizar manualmente el documento en Firebase
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          [`messages.${Date.now()}`]: mensajeData,
          lastMessage: {
            content: mensaje,
            timestamp: serverTimestamp(),
            senderId: emisorIdStr
          },
          updatedAt: serverTimestamp()
        });
        return true;
      } catch (firebaseError) {
        console.error('Error al guardar mensaje en Firebase:', firebaseError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return false;
  }
};
