import { db } from '../firebase/config';

export const initializeChat = async (clienteId, psicologoId) => {
  // Garantizar que el ID sea seguro para rutas y Firestore
  const chatId = `${clienteId.replace(/[/.]/g, '_')}_${psicologoId.replace(/[/.]/g, '_')}`;
  const chatRef = doc(db, 'chats', chatId);
  
  const chatDoc = await getDoc(chatRef);
  
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      participants: [clienteId, psicologoId],
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
  
  await updateDoc(chatRef, {
    lastMessage: {
      content: message.content,
      timestamp: serverTimestamp(),
      senderId: message.senderId
    },
    updatedAt: serverTimestamp()
  });
};
