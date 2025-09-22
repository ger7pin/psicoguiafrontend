import { db, getFirebaseConnectionStatus } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { sendChatMessage } from '../utils/socketService';

// Constante para la colección principal de chats
const CHATS_COLLECTION = 'chats';
// Constante para la subcolección de mensajes
const MESSAGES_SUBCOLLECTION = 'mensajes';

// Cache local para mensajes cuando Firebase no está disponible
const localMessagesCache = {};

// Verificar la configuración de Firebase
const firebaseStatus = getFirebaseConnectionStatus();
if (firebaseStatus.isDemo) {
  console.warn('⚠️ ADVERTENCIA: Chat usando configuración de Firebase de demostración');
  console.warn('Los mensajes solo se enviarán por Socket.io y se almacenarán en caché local');
}

export const initializeChat = async (clienteId, psicologoId) => {
  try {
    // Verificar estado de Firebase antes de proceder
    const firebaseStatus = getFirebaseConnectionStatus();
    
    // Verificar que los IDs existan y sean válidos
    if (!clienteId || !psicologoId || clienteId === 'undefined' || psicologoId === 'undefined') {
      console.error('Error: clienteId o psicologoId inválidos', { clienteId, psicologoId });
      throw new Error('IDs de usuario inválidos');
    }
    
    // Limpiar y normalizar los IDs para que sean seguros en Firestore
    // Quitamos cualquier caracter especial y nos aseguramos que sean strings
    let clienteIdStr = String(clienteId || '').trim();
    let psicologoIdStr = String(psicologoId || '').trim();
    
    // Reemplazar caracteres no válidos para rutas en Firestore
    clienteIdStr = clienteIdStr.replace(/[\/.#$\[\]]/g, '_');
    psicologoIdStr = psicologoIdStr.replace(/[\/.#$\[\]]/g, '_');
    
    // Asegurarnos que los IDs no estén vacíos después de la limpieza
    if (!clienteIdStr || !psicologoIdStr) {
      throw new Error('IDs de usuario quedaron vacíos después de la limpieza');
    }
    
    // Crear un ID de chat consistente
    const chatId = `${clienteIdStr}_${psicologoIdStr}`;
    console.log('Usando ID de chat:', chatId);
    
    // Verificar si estamos en modo demo o con problemas de conexión
    if (firebaseStatus.isDemo) {
      console.log('Firebase en modo demo. Usando caché local para el chat');
      // Crear estructura del chat en cache local
      if (!localMessagesCache[chatId]) {
        localMessagesCache[chatId] = {
          mensajes: [],
          metadata: {
            clienteId: clienteIdStr,
            psicologoId: psicologoIdStr,
            createdAt: new Date().toISOString(),
            lastMessage: {
              content: "Inicio de conversación (caché local)",
              timestamp: new Date().toISOString(),
              senderId: "sistema"
            }
          }
        };
      }
      return chatId;
    }
    
    // Continuamos con Firebase si está disponible
    if (!db) {
      console.error('Error: la instancia de Firestore no está disponible');
      throw new Error('Firestore no inicializado');
    }
    
    // Referenciar el documento de chat
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    
    // Intentar obtener el documento
    let chatDoc;
    try {
      chatDoc = await getDoc(chatRef);
    } catch (err) {
      console.error('Error al obtener documento de chat:', err);
      chatDoc = { exists: () => false };
    }
  
      // Si el documento no existe, crearlo
    if (!chatDoc.exists()) {
      console.log('Creando nuevo documento de chat con ID:', chatId);
      try {
        // Crear estructura base del chat
        const chatData = {
          participants: [clienteIdStr, psicologoIdStr],
          clienteId: clienteIdStr,
          psicologoId: psicologoIdStr,
          lastMessage: {
            content: "Inicio de conversación",
            timestamp: serverTimestamp(),
            senderId: "sistema"
          },
          mensajesCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Guardar el documento principal
        await setDoc(chatRef, chatData);
        console.log('Documento de chat creado exitosamente');
        
        // Crear mensaje inicial en la subcolección de mensajes
        try {
          const mensajesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
          const mensajeInicial = {
            content: "Inicio de conversación",
            timestamp: serverTimestamp(),
            senderId: "sistema"
          };
          
          // No esperamos a que se complete esta operación para no bloquear
          setDoc(doc(mensajesRef), mensajeInicial)
            .then(() => console.log('Mensaje inicial creado'))
            .catch(err => console.error('Error creando mensaje inicial:', err));
            
        } catch (msgError) {
          console.warn('Error al crear mensaje inicial:', msgError);
          // No interrumpimos el flujo por este error
        }
      } catch (error) {
        console.error('Error al crear documento de chat:', error);
        throw new Error(`No se pudo crear el chat: ${error.message}`);
      }
    } else {
      console.log('Chat ya existe, usando documento existente');
    }
    
    // Verificar que el chat se haya creado correctamente
    return chatId;
  } catch (error) {
    console.error('Error general en initializeChat:', error);
    // En caso de error, lanzamos la excepción para que sea manejada por el llamador
    throw error;
  }
};

export const updateChatMessage = async (chatId, message) => {
  try {
    // Verificar parámetros
    if (!chatId || !message || !message.content) {
      console.error('Parámetros inválidos para updateChatMessage:', { chatId, message });
      return false;
    }
    
    // Verificar si estamos en modo demo
    const firebaseStatus = getFirebaseConnectionStatus();
    if (firebaseStatus.isDemo) {
      console.log('Firebase en modo demo - No se actualiza el documento principal');
      return true;
    }

    // Asegurarnos que el chatId es seguro
    const cleanChatId = String(chatId).replace(/[\/.#$\[\]]/g, '_');
    
    // Referenciar el documento
    const chatRef = doc(db, CHATS_COLLECTION, cleanChatId);
    
    // Datos a actualizar
    const updateData = {
      lastMessage: {
        content: message.content,
        timestamp: serverTimestamp(),
        senderId: message.senderId || 'unknown'
      },
      updatedAt: serverTimestamp()
    };
    
    // Actualizar el documento en Firebase
    await updateDoc(chatRef, updateData);
    return true;
  } catch (error) {
    console.error('Error al actualizar mensaje en chat:', error);
    return false;
  }
};

export const enviarMensaje = async (chatId, mensaje, receptorId, emisorId) => {
  try {
    // Validar parámetros
    if (!chatId || !mensaje || !receptorId) {
      console.error('Parámetros incompletos para enviarMensaje:', { chatId, mensaje, receptorId, emisorId });
      return false;
    }
    
    // Limpiar y normalizar IDs
    const cleanChatId = String(chatId).replace(/[\/.#$\[\]]/g, '_');
    const receptorIdStr = String(receptorId).replace(/[\/.#$\[\]]/g, '_');
    const emisorIdStr = emisorId ? String(emisorId).replace(/[\/.#$\[\]]/g, '_') : 'unknown';
    
    console.log(`Enviando mensaje en chat ${cleanChatId} a ${receptorIdStr} desde ${emisorIdStr}`);
    
    // Crear datos del mensaje con ID único
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mensajeData = {
      chatId: cleanChatId,
      content: mensaje,
      senderId: emisorIdStr,
      receptorId: receptorIdStr,
      timestamp: new Date().toISOString(),
      id: messageId
    };
    
    // Verificar si estamos en modo demo
    const firebaseStatus = getFirebaseConnectionStatus();
    
    // Si estamos en modo demo, usar caché local
    if (firebaseStatus.isDemo) {
      console.log('Firebase en modo demo - Guardando mensaje en caché local');
      
      // Inicializar la caché si no existe
      if (!localMessagesCache[cleanChatId]) {
        localMessagesCache[cleanChatId] = {
          mensajes: [],
          metadata: {
            clienteId: emisorIdStr.includes('cliente') ? emisorIdStr : receptorIdStr,
            psicologoId: emisorIdStr.includes('psicologo') ? emisorIdStr : receptorIdStr,
            createdAt: new Date().toISOString()
          }
        };
      }
      
      // Guardar mensaje en caché local
      localMessagesCache[cleanChatId].mensajes.push(mensajeData);
      localMessagesCache[cleanChatId].metadata.lastMessage = {
        content: mensaje,
        timestamp: new Date().toISOString(),
        senderId: emisorIdStr
      };
      
      console.log('Mensaje guardado en caché local');
    } else {
      // Guardar mensaje en Firebase
      try {
        // 1. Guardar mensaje en la subcolección
        const mensajesRef = collection(db, CHATS_COLLECTION, cleanChatId, MESSAGES_SUBCOLLECTION);
        const docRef = doc(mensajesRef);
        await setDoc(docRef, {
          content: mensaje,
          senderId: emisorIdStr,
          receptorId: receptorIdStr,
          timestamp: serverTimestamp(),
          id: docRef.id
        });
        
        // 2. Actualizar el documento principal
        const chatRef = doc(db, CHATS_COLLECTION, cleanChatId);
        await updateDoc(chatRef, {
          lastMessage: {
            content: mensaje,
            timestamp: serverTimestamp(),
            senderId: emisorIdStr
          },
          updatedAt: serverTimestamp()
        });
        
        console.log('Mensaje guardado correctamente en Firebase');
      } catch (firebaseError) {
        console.error('Error al guardar mensaje en Firebase:', firebaseError);
        // Guardar en caché local como respaldo
        if (!localMessagesCache[cleanChatId]) {
          localMessagesCache[cleanChatId] = { mensajes: [], metadata: {} };
        }
        localMessagesCache[cleanChatId].mensajes.push(mensajeData);
        console.warn('Mensaje guardado en caché local como respaldo');
      }
    }
    
    // Enviar mensaje por Socket.io para comunicación en tiempo real
    try {
      const enviado = sendChatMessage(receptorIdStr, mensajeData);
      if (!enviado) {
        console.warn('No se pudo enviar mensaje por socket, pero se guardó en Firebase/caché');
      } else {
        console.log('Mensaje enviado por socket correctamente');
      }
    } catch (socketError) {
      console.error('Error enviando mensaje por socket:', socketError);
      // El mensaje ya se guardó en Firebase/caché, así que no es crítico
    }

    return true;
  } catch (error) {
    console.error('Error general al enviar mensaje:', error);
    return false;
  }
};

// Obtener mensajes de un chat desde Firebase o caché local
export const obtenerMensajes = async (chatId) => {
  try {
    if (!chatId) {
      console.error('Error: chatId es requerido para obtener mensajes');
      return [];
    }
    
    // Limpiar el chatId
    const cleanChatId = String(chatId).replace(/[\/.#$\[\]]/g, '_');
    console.log('Obteniendo mensajes para chat:', cleanChatId);
    
    // Verificar si estamos en modo demo
    const firebaseStatus = getFirebaseConnectionStatus();
    
    // Si estamos en modo demo, usar caché local
    if (firebaseStatus.isDemo) {
      console.log('Firebase en modo demo - Usando caché local para mensajes');
      
      // Inicializar caché si no existe
      if (!localMessagesCache[cleanChatId]) {
        localMessagesCache[cleanChatId] = {
          mensajes: [],
          metadata: {
            createdAt: new Date().toISOString(),
            lastMessage: {
              content: "Inicio de conversación (caché local)",
              timestamp: new Date().toISOString(),
              senderId: "sistema"
            }
          }
        };
      }
      
      // Retornar un objeto simulado compatible con la API de Firestore
      return {
        _isLocalCache: true,
        getLocalMessages: () => localMessagesCache[cleanChatId].mensajes,
        simulateSnapshot: (callback) => {
          // Simular un snapshot con los mensajes en caché
          callback({
            docs: localMessagesCache[cleanChatId].mensajes.map(msg => ({
              id: msg.id || `local_${Date.now()}`,
              data: () => msg
            }))
          });
          
          // Retornar función de limpieza
          return () => {};
        }
      };
    }
    
    // Si Firebase está disponible, retornar la referencia a la colección
    const mensajesRef = collection(db, CHATS_COLLECTION, cleanChatId, MESSAGES_SUBCOLLECTION);
    return mensajesRef;
  } catch (error) {
    console.error('Error al obtener referencia de mensajes:', error);
    // En caso de error, retornar un objeto que simula la colección vacía
    return {
      _isLocalCache: true,
      getLocalMessages: () => [],
      simulateSnapshot: (callback) => {
        callback({ docs: [] });
        return () => {};
      }
    };
  }
};

// Función para verificar si la referencia de mensajes es una caché local
export const isLocalCacheRef = (ref) => {
  return ref && ref._isLocalCache === true;
};

// Obtener mensajes de caché local
export const getMessagesFromLocalCache = (chatId) => {
  const cleanChatId = String(chatId).replace(/[\/.#$\[\]]/g, '_');
  return localMessagesCache[cleanChatId]?.mensajes || [];
};
