import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import useAuthUser from '../hooks/useAuthUser';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeChat, enviarMensaje as enviarMensajeService } from '../services/chatService';
import { initSocket, subscribeToMessages, subscribeToTypingStatus, sendTypingStatus } from '../utils/socketService';

// Constantes para nombres de colecciones
const CHATS_COLLECTION = 'chats';
const MESSAGES_SUBCOLLECTION = 'mensajes';

const Chat = ({ clienteId, psicologoId, onClose }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [contactoNombre, setContactoNombre] = useState('Contacto');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const chatRef = useRef(null);
  
  // Determinar el tipo de usuario correctamente basado en los IDs proporcionados
  // Si se proporciona clienteId y psicologoId, determinamos el tipo basado en la pantalla actual
  // Si estamos en el dashboard de psicólogos, el usuario actual es un psicólogo
  // Si estamos en el dashboard de clientes, el usuario actual es un cliente
  const determinarTipoUsuario = () => {
    // Primero intentar obtener del localStorage (más confiable)
    const storedType = localStorage.getItem('userType');
    if (storedType === 'clientes' || storedType === 'psicologos') {
      return storedType;
    }
    
    // Identificar por URL actual
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/psicologos/dashboard')) {
        return 'psicologos';
      }
      if (path.includes('/clientes/dashboard')) {
        return 'clientes';
      }
    }
    
    // Si no podemos determinar por la URL, usar la lógica basada en IDs
    // Si el usuario actual es el psicólogo (su ID coincide con psicologoId), entonces es psicólogo
    // Si el usuario actual es el cliente (su ID coincide con clienteId), entonces es cliente
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && psicologoId && storedUserId == psicologoId) {
      return 'psicologos';
    }
    if (storedUserId && clienteId && storedUserId == clienteId) {
      return 'clientes';
    }
    
    // Ultimo respaldo - verificar si la URL contiene /clientes/ o /psicologos/
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/clientes/')) {
        return 'clientes';
      } 
      return 'psicologos';
    }
    
    // Si todo lo demás falla, asumir cliente como valor predeterminado seguro
    return 'clientes';
  };
  
  const userType = determinarTipoUsuario();
  
  // Obtener datos del usuario actual y token
  const { cliente: usuarioActual, token } = useAuthUser(userType);
  
  // Usar token del localStorage como respaldo si no está disponible desde useAuthUser
  // Intentar obtener un token específico para el tipo de usuario si existe
  const getStoredToken = () => {
    // Primero intentar obtener un token específico para el tipo
    const userSpecificToken = localStorage.getItem(`authToken_${userType}`);
    if (userSpecificToken) return userSpecificToken;
    
    // Si no hay token específico, intentar con el genérico
    return localStorage.getItem('authToken');
  };
  
  const [authToken, setAuthToken] = useState(token || getStoredToken());
  
  // Guardar datos de autenticación en localStorage cuando estén disponibles
  useEffect(() => {
    if (usuarioActual?.id) {
      localStorage.setItem('userId', usuarioActual.id);
      localStorage.setItem('userType', userType);
    }
    
    // Si tenemos un token nuevo, guardarlo y actualizarlo en el estado
    if (token && token !== authToken) {
      // Guardar tanto en el almacenamiento específico como en el genérico
      localStorage.setItem(`authToken_${userType}`, token);
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      console.log(`Token actualizado para ${userType}:`, token);
    }
  }, [usuarioActual, userType, token, authToken]);
  const usuarioId = usuarioActual?.id;

  // Obtener el nombre del contacto
  // Función para obtener el nombre del contacto de localStorage (con useCallback para evitar recreaciones)
  const obtenerNombreContactoLocal = React.useCallback(() => {
    try {
      const idBuscado = userType === 'clientes' ? psicologoId : clienteId;
      
      // Buscar en las distintas fuentes de datos en localStorage
      let todosContactos = [];
      try { todosContactos = [...todosContactos, ...JSON.parse(localStorage.getItem('contactos') || '[]')]; } catch (e) {console.error('Error al obtener contactos:', e)}
      try { todosContactos = [...todosContactos, ...JSON.parse(localStorage.getItem('psicologos') || '[]')]; } catch (e) {console.error('Error al obtener psicólogos:', e)}
      try { todosContactos = [...todosContactos, ...JSON.parse(localStorage.getItem('clientes') || '[]')]; } catch (e) {console.error('Error al obtener clientes:', e)}
      
      const contacto = todosContactos.find(c => c.id == idBuscado);
      if (contacto?.nombre) {
        return contacto.nombre;
      }
      
      return `${userType === 'clientes' ? 'Psicólogo' : 'Cliente'} #${idBuscado}`;
    } catch (e) {
      console.error('Error obteniendo nombre local:', e);
      return 'Contacto';
    }
  }, [userType, psicologoId, clienteId]); // Dependencias necesarias
  
  useEffect(() => {
    const obtenerNombreContacto = async () => {
      try {
        // Primero establecer un nombre desde datos locales
        setContactoNombre(obtenerNombreContactoLocal());
        
        // Luego intentar obtener el nombre actualizado del servidor
        // Usar las rutas existentes en el backend según rutas.js
        const endpoint = userType === 'clientes' ? 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/psicologos/${psicologoId}` : 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/${clienteId}`;
        
        console.log('Obteniendo datos de contacto desde:', endpoint);
        
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const listaUsuarios = await response.json();
          console.log('Usuarios obtenidos:', listaUsuarios.length || 0);
          
          // Buscar el usuario específico por ID
          const idBuscado = userType === 'clientes' ? psicologoId : clienteId;
          const usuarioEncontrado = Array.isArray(listaUsuarios) ? 
            listaUsuarios.find(u => u.id == idBuscado) : null;
          
          if (usuarioEncontrado) {
            console.log('Usuario encontrado:', usuarioEncontrado);
            setContactoNombre(usuarioEncontrado.nombre || 'Contacto');
          } else {
            console.log('Usuario no encontrado con ID:', idBuscado);
            // Si no encuentra el usuario, intentar obtener información del localStorage
            const contactosGuardados = JSON.parse(localStorage.getItem('contactos') || '[]');
            const contactoGuardado = contactosGuardados.find(c => c.id == idBuscado);
            
            if (contactoGuardado) {
              setContactoNombre(contactoGuardado.nombre || 'Contacto');
            } else {
              setContactoNombre(`${userType === 'clientes' ? 'Psicólogo' : 'Cliente'} #${idBuscado}`);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener nombre del contacto:', error);
      }
    };
    
    if ((userType === 'clientes' && psicologoId) || (userType === 'psicologos' && clienteId)) {
      obtenerNombreContacto();
    }
  }, [userType, clienteId, psicologoId, obtenerNombreContactoLocal]);

  useEffect(() => {
    const setupChat = async () => {
      if (!clienteId || !psicologoId) {
        console.log('Faltan datos de usuarios para inicializar chat:', { clienteId, psicologoId });
        return;
      }
      
      // Usar el token disponible (desde el hook o el localStorage)
      const currentToken = token || authToken || localStorage.getItem('authToken');
      
      // Si no hay token disponible
      if (!currentToken) {
        console.log('No hay token disponible para inicializar el chat');
        
        // Intentar renovar la sesión usando la ruta de verificación
        try {
          // Usar la ruta de verificación que existe en el backend
          const verifyEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`;
          console.log('Intentando obtener token desde:', verifyEndpoint);
          
          const response = await fetch(verifyEndpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.id) {
              // La verificación fue exitosa, podemos continuar aunque no tengamos el token explícito
              // El token estará en las cookies y se enviará automáticamente
              console.log('Sesión verificada correctamente, continuando...');
              // Guardar los datos del usuario pero sin token explícito
              // ya que está en las cookies y se maneja automáticamente
              localStorage.setItem('userId', data.id);
              localStorage.setItem('userType', userType);
            } else {
              console.log('Verificación exitosa pero sin datos de usuario');  
              return; // Abandonar
            }
          } else {
            console.error('Verificación fallida, redirección necesaria');
            // En este punto, debemos abandonar ya que no hay autenticación
            return;
          }
        } catch (err) {
          console.error('Error en la verificación:', err);
          return;
        }
      }
      
      try {
        // Inicializar Firebase primero (esto es independiente del token)
        let chatID;
        try {
          chatID = await initializeChat(clienteId, psicologoId);
          console.log('Chat inicializado con ID:', chatID);
        } catch (firebaseError) {
          console.error('Error inicializando Firebase:', firebaseError);
          // Generar un ID manualmente como respaldo
          try {
            // Asegurarse de que clienteId y psicologoId sean strings y manejar cualquier caso nulo
            const clienteIdStr = clienteId ? String(clienteId) : 'unknown';
            const psicologoIdStr = psicologoId ? String(psicologoId) : 'unknown';
            chatID = `${clienteIdStr.replace(/[/.#$\[\]]/g, '_')}_${psicologoIdStr.replace(/[/.#$\[\]]/g, '_')}`;
            console.log('Usando ID de chat de respaldo:', chatID);
          } catch (strError) {
            // Último recurso si todo falla
            console.error('Error creando ID de respaldo:', strError);
            chatID = `${Date.now()}_fallback`;
          }
        }
        
        setChatId(chatID);
        
        // Inicializar Socket.io con el token disponible (o sin él)
        const currentToken = token || authToken || localStorage.getItem('authToken');
        try {
          const socket = initSocket(currentToken);
          console.log('Socket inicializado:', socket ? 'Conectado' : 'Error al conectar');
        } catch (socketErr) {
          console.error('Error inicializando Socket.io:', socketErr);
          // Continuamos igual para al menos mostrar mensajes de Firebase
        }
        
        // Suscribirse a los mensajes en Firebase usando la estructura correcta
        let unsubscribe;
        let unsubscribeSocketMessages;
        let unsubscribeTyping;
        
        try {
          const mensajesRef = collection(db, CHATS_COLLECTION, chatID, MESSAGES_SUBCOLLECTION);
          const q = query(
            mensajesRef,
            orderBy('timestamp', 'asc')
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            try {
              const messageList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setMensajes(messageList);
              console.log(`Recibidos ${messageList.length} mensajes de Firebase`);
            } catch (docError) {
              console.error('Error procesando documentos:', docError);
            }
          }, (error) => {
            console.error('Error en la suscripción a mensajes:', error);
          });

          // Suscribirse a mensajes en tiempo real via Socket.io
          unsubscribeSocketMessages = subscribeToMessages((msg) => {
            try {
              // Solo procesamos mensajes que sean para este chat
              if (msg.chatId === chatID) {
                // Los mensajes de Socket.io se guardarán en Firebase automáticamente
                // por el controlador de mensajes del backend
                console.log('Mensaje recibido por Socket.io:', msg);
              }
            } catch (msgError) {
              console.error('Error procesando mensaje de socket:', msgError);
            }
          });

          // Suscribirse al estado de escritura
          unsubscribeTyping = subscribeToTypingStatus(({ emisorId, escribiendo }) => {
            try {
              if (emisorId === psicologoId || emisorId === clienteId) {
                setUsuarioEscribiendo(escribiendo);
              }
            } catch (typingError) {
              console.error('Error procesando estado de escritura:', typingError);
            }
          });
          
          console.log('Suscripciones establecidas correctamente');
          
          // Retornar función de limpieza
          return () => {
            if (unsubscribe) unsubscribe();
            if (unsubscribeSocketMessages) unsubscribeSocketMessages();
            if (unsubscribeTyping) unsubscribeTyping();
            console.log('Suscripciones limpiadas');
          };
        } catch (firebaseError) {
          console.error('Error configurando suscripciones a Firebase:', firebaseError);
          // Retornar función de limpieza mínima
          return () => {
            if (unsubscribeSocketMessages) unsubscribeSocketMessages();
            if (unsubscribeTyping) unsubscribeTyping();
          };
        }
      } catch (error) {
        console.error('Error al inicializar chat:', error);
        toast.error('Error al inicializar el chat');
      }
    };

    setupChat();
  }, [clienteId, psicologoId, token, authToken, userType, usuarioActual]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
    
    // Enviar estado de escritura
    if (chatId) {
      // Cancelar el timeout anterior si existe
      if (timeoutId) clearTimeout(timeoutId);
      
      // Enviar señal de escritura
      sendTypingStatus(psicologoId, true);
      
      // Configurar un nuevo timeout para enviar señal de fin de escritura
      const newTimeoutId = setTimeout(() => {
        sendTypingStatus(psicologoId, false);
      }, 1000);
      
      setTimeoutId(newTimeoutId);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMensaje(prev => prev + emojiData.emoji);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() && !archivo) return;
    
    // Verificar que tenemos ID de usuario y usar respaldo si es necesario
    let senderUserId = usuarioId;
    if (!senderUserId) {
      console.warn('Usuario no autenticado, buscando ID en localStorage');
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        toast.error('Error: No se puede identificar al usuario');
        return;
      }
      senderUserId = storedUserId;
    }
    
    // Verificar que tenemos chatId
    if (!chatId) {
      toast.error('Error: Chat no inicializado');
      return;
    }
    
    // Evitar múltiples envíos
    if (enviandoMensaje) return;
    setEnviandoMensaje(true);

    try {
      // Detener señal de escritura
      try {
        sendTypingStatus(psicologoId, false);
        if (timeoutId) clearTimeout(timeoutId);
      } catch (typingErr) {
        console.error('Error al enviar estado de escritura:', typingErr);
      }
      
      // Limpiar ID del chat para evitar problemas con Firebase
      const cleanChatId = String(chatId).replace(/[\/\.#$\[\]]/g, '_');
      
      // Calcular ID del receptor
      const receptorId = userType === 'clientes' ? psicologoId : clienteId;
      if (!receptorId) {
        throw new Error('ID del receptor no disponible');
      }
      
      console.log(`Enviando mensaje en chat ${cleanChatId} desde ${senderUserId} a ${receptorId}`);
      
      // Añadir mensaje a la UI para feedback inmediato
      const nuevoMensaje = {
        id: `temp_${Date.now()}`,
        chatId: cleanChatId,
        content: mensaje,
        senderId: senderUserId,
        timestamp: new Date()
      };
      
      // Agregarlo localmente al estado
      setMensajes(prev => [...prev, nuevoMensaje]);
      
      // Hacer scroll al último mensaje
      if (chatRef.current) {
        setTimeout(() => {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      }
      
      // Usar el servicio centralizado para enviar mensajes (maneja tanto Firebase como Socket.io)
      const enviado = await enviarMensajeService(cleanChatId, mensaje, receptorId, senderUserId);
      
      if (!enviado) {
        toast.warning('Mensaje guardado localmente, pero puede haber problemas de conexión');
      }
      
      // Limpiar la interfaz
      setMensaje('');
      setArchivo(null);
      setMostrarEmojis(false);
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setEnviandoMensaje(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            Chat con {contactoNombre}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === usuarioId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.senderId === usuarioId ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-60">
                {(() => {
                  try {
                    if (msg.timestamp?.toDate) {
                      return new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else if (msg.timestamp instanceof Date) {
                      return msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else if (typeof msg.timestamp === 'string') {
                      return new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else {
                      return '...';  
                    }
                  } catch (e) {
                    console.warn('Error al formatear fecha:', e);
                    return '...'; 
                  }
                })()}
              </p>
            </div>
          </div>
        ))}
        
        {usuarioEscribiendo && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-2 text-sm text-gray-500">
              Escribiendo...
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="border-t p-4">
        <form onSubmit={enviarMensaje} className="flex items-end space-x-2">
          <button
            type="button"
            onClick={() => setMostrarEmojis(!mostrarEmojis)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            😊
          </button>
          {mostrarEmojis && (
            <div className="absolute bottom-full mb-2">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <input
            type="text"
            value={mensaje}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={((!mensaje.trim() && !archivo) || enviandoMensaje)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
          >
            {enviandoMensaje ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
