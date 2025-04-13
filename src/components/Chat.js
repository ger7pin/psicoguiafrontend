import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import useAuthUser from '../hooks/useAuthUser';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeChat, updateChatMessage } from '../services/chatService';
import { initSocket, getSocket, subscribeToMessages, subscribeToTypingStatus, sendTypingStatus, sendChatMessage } from '../utils/socketService';

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
  
  // Determinar el tipo de usuario usando localStorage y la URL como respaldo
  const userType = localStorage.getItem('userType') || 
                 (typeof window !== 'undefined' && window.location.pathname.includes('/clientes/') ? 
                  'clientes' : 'psicologos');
  
  // Obtener datos del usuario actual y token
  const { cliente: usuarioActual, token } = useAuthUser(userType);
  
  // Usar token del localStorage como respaldo si no está disponible desde useAuthUser
  const [authToken, setAuthToken] = useState(token || localStorage.getItem('authToken'));
  
  // Guardar datos de autenticación en localStorage cuando estén disponibles
  useEffect(() => {
    if (usuarioActual?.id) {
      localStorage.setItem('userId', usuarioActual.id);
      localStorage.setItem('userType', userType);
    }
    
    // Si tenemos un token nuevo, guardarlo y actualizarlo en el estado
    if (token && token !== authToken) {
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      console.log('Token actualizado:', token);
    }
  }, [usuarioActual, userType, token, authToken]);
  const usuarioId = usuarioActual?.id;

  // Obtener el nombre del contacto
  // Función para obtener el nombre del contacto de localStorage
  const obtenerNombreContactoLocal = () => {
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
  };
  
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
  }, [userType, clienteId, psicologoId]);

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
          chatID = `${clienteId.toString().replace(/[/.]/g, '_')}_${psicologoId.toString().replace(/[/.]/g, '_')}`;
          console.log('Usando ID de chat de respaldo:', chatID);
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
        
        // Suscribirse a los mensajes en Firebase
        const q = query(
          collection(db, 'chats', id, 'messages'),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMensajes(messageList);
        });

        // Suscribirse a mensajes en tiempo real via Socket.io
        const unsubscribeSocketMessages = subscribeToMessages((msg) => {
          // Solo procesamos mensajes que sean para este chat
          if (msg.chatId === id) {
            // Los mensajes de Socket.io se guardarán en Firebase automáticamente
            // por el controlador de mensajes del backend
            console.log('Mensaje recibido por Socket.io:', msg);
          }
        });

        // Suscribirse al estado de escritura
        const unsubscribeTyping = subscribeToTypingStatus(({ emisorId, escribiendo }) => {
          if (emisorId === psicologoId || emisorId === clienteId) {
            setUsuarioEscribiendo(escribiendo);
          }
        });

        return () => {
          unsubscribe();
          unsubscribeSocketMessages();
          unsubscribeTyping();
        };
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
    if (!usuarioId) {
      toast.error('Error: Usuario no autenticado');
      // Intentar obtener el ID de localStorage como último recurso
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) return;
      usuarioId = storedUserId;
    }
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
      
      const messageData = {
        content: mensaje,
        senderId: usuarioId,
        timestamp: serverTimestamp()
      };

      // Guardar mensaje en Firebase con manejo de errores
      try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
        
        // Si el mensaje se guardó correctamente en Firebase, intentar actualizar el documento principal
        try {
          await updateChatMessage(chatId, messageData);
        } catch (updateErr) {
          console.error('Error al actualizar chat document:', updateErr);
          // Continuamos igualmente para al menos mostrar el mensaje en la UI
        }
      } catch (firestoreErr) {
        console.error('Error al guardar mensaje en Firebase:', firestoreErr);
        toast.error('Error al guardar mensaje');
        throw firestoreErr; // Propagar el error para abortar el envío
      }
      
      // Enviar mensaje a través de Socket.io para comunicación en tiempo real
      const receptorId = userType === 'clientes' ? psicologoId : clienteId; // Si es cliente, envía al psicólogo y viceversa
      
      // Usando la función helper de socketService
      const mensajeEnviado = sendChatMessage(receptorId, {
        chatId,
        content: mensaje,
        senderId: usuarioId,
        timestamp: new Date()
      });
      
      if (!mensajeEnviado) {
        console.log('Reintentando con socket directo...');
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('chat message', {
            chatId,
            content: mensaje,
            senderId: usuarioId,
            receptorId,
            timestamp: new Date()
          });
        }
      }
      
      setMensaje('');
      setArchivo(null);
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
                {msg.timestamp?.toDate ? 
                  new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                  '...'}
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
