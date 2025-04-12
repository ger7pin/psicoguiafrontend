import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendChatMessage } from '../utils/socketService';

export const initializeChat = async (clienteId, psicologoId) => {
  // Garantizar que el ID sea seguro para rutas y Firestore
  const chatId = `${clienteId.replace(/[/.]/g, '_')}_${psicologoId.replace(/[/.]/g, '_')}`;
  const chatRef = doc(db, 'chats', chatId);
  
  const chatDoc = await getDoc(chatRef);
  
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      participants: [clienteId, psicologoId],
      clienteId,
      psicologoId,
      lastMessage: {
        content: "Inicio de conversación",
        timestamp: serverTimestamp(),
        senderId: "sistema"
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return chatId;
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
    // Enviar mensaje a través de Socket.io para comunicación en tiempo real
    sendChatMessage(receptorId, {
      chatId, 
      content: mensaje,
      senderId: emisorId,
      timestamp: new Date()
    });

    // El mensaje se guarda en Firestore a través del componente Chat
    return true;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return false;
  }
};
