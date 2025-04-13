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
  // Función para obtener el nombre del contacto usando datos previamente cargados
  const obtenerNombreContactoLocal = () => {
    try {
      // Determinar cuál ID estamos buscando
      const idBuscado = userType === 'clientes' ? psicologoId : clienteId;
      
      // Intentar obtener datos desde localStorage
      let contactosGuardados = [];
      
      // Dependiendo del tipo de usuario, buscar en psicólogos o clientes
      if (userType === 'clientes') {
        // Si somos cliente, buscamos en la lista de psicólogos
        contactosGuardados = JSON.parse(localStorage.getItem('psicologos') || '[]');
      } else {
        // Si somos psicólogo, buscamos en la lista de clientes
        contactosGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
      }
      
      // También revisar en la lista genérica de contactos
      const todosContactos = JSON.parse(localStorage.getItem('contactos') || '[]');
      contactosGuardados = [...contactosGuardados, ...todosContactos];
      
      const contactoGuardado = contactosGuardados.find(c => c.id == idBuscado);
      
      if (contactoGuardado && contactoGuardado.nombre) {
        setContactoNombre(contactoGuardado.nombre);
        return true;
      }
      
      // Si no encontramos, usar un nombre genérico pero descriptivo
      setContactoNombre(`${userType === 'clientes' ? 'Psicólogo' : 'Cliente'} #${idBuscado}`);
      return false;
    } catch (error) {
      console.error('Error obteniendo contacto local:', error);
      setContactoNombre('Contacto');
      return false;
    }
  };
  
  useEffect(() => {
    const obtenerNombreContacto = async () => {
      // Primero intentar con datos locales para una experiencia más rápida
      const encontradoLocalmente = obtenerNombreContactoLocal();
      
      try {
        // Ahora intentar actualizar con datos del servidor
        // Usar rutas alternativas ya que /api/psicologos y /api/clientes parecen no funcionar
        const endpoint = userType === 'clientes' ? 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/psicologos/todos` : 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/todos`;
        
        console.log('Obteniendo datos de contacto desde:', endpoint);
        
        const response = await fetch(endpoint, {
          credentials: 'include'
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
      
      // Si no hay token, intentar continuar sin él para al menos mostrar mensajes de Firebase
      // Socket.io no funcionará, pero al menos podremos ver mensajes anteriores
      if (!currentToken) {
        console.log('No hay token disponible para inicializar el chat');
        // Intentar renovar la sesión antes de continuar
        try {
          // Probar múltiples rutas para renovar token, ya que no estamos seguros de cuál funciona
          const endpoints = [
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/renew-token`,
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/${userType}/renew`
          ];
          
          let tokenRenovado = false;
          
          for (const endpoint of endpoints) {
            try {
              console.log('Intentando renovar token en:', endpoint);
              const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.token) {
                  localStorage.setItem('authToken', data.token);
                  setAuthToken(data.token);
                  console.log('Token renovado exitosamente desde:', endpoint);
                  tokenRenovado = true;
                  break;
                }
              }
            } catch (innerErr) {
              console.error(`Error con endpoint ${endpoint}:`, innerErr);
            }
          }
          
          if (!tokenRenovado) {
            console.log('No se pudo renovar el token, continuando sin él...');
            // Continuamos sin token para al menos mostrar mensajes de Firebase
          }
        } catch (err) {
          console.error('Error renovando token:', err);
          // Continuamos sin token para al menos mostrar mensajes de Firebase
        }
      }
      
      try {
        // Inicializar chat en Firebase primero
        // Esto permite que al menos la parte de Firebase funcione incluso si Socket.io falla
        try {
          const id = await initializeChat(clienteId, psicologoId);
          console.log('Chat inicializado con ID:', id);
          setChatId(id);
        } catch (firebaseErr) {
          console.error('Error inicializando chat en Firebase:', firebaseErr);
          // Si falla Firebase, generamos un ID de chat en formato similar
          const fallbackId = `${clienteId.toString().replace(/[/.]/g, '_')}_${psicologoId.toString().replace(/[/.]/g, '_')}`;
          console.log('Usando ID de chat de respaldo:', fallbackId);
          setChatId(fallbackId);
        }
        
        // Intentar inicializar Socket.io con el token disponible
        const currentToken = token || authToken || localStorage.getItem('authToken');
        try {
          const socket = initSocket(currentToken);
          console.log('Socket inicializado:', socket ? 'Conectado' : 'Error al conectar', { tokenUsado: currentToken ? 'Disponible' : 'No disponible' });
        } catch (socketErr) {
          console.error('Error inicializando Socket.io:', socketErr);
          // Continuamos a pesar del error en Socket.io
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
    if (!usuarioId) return toast.error('Error: Usuario no autenticado');
    if (!chatId) return toast.error('Error: Chat no inicializado');
    
    // Evitar múltiples envíos
    if (enviandoMensaje) return;
    setEnviandoMensaje(true);

    try {
      // Detener señal de escritura
      sendTypingStatus(psicologoId, false);
      if (timeoutId) clearTimeout(timeoutId);
      
      const messageData = {
        content: mensaje,
        senderId: usuarioId,
        timestamp: serverTimestamp()
      };

      // Guardar mensaje en Firebase
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Actualizar último mensaje en el documento principal del chat
      await updateChatMessage(chatId, messageData);
      
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
