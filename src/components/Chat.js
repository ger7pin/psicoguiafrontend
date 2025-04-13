import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import useAuthUser from '../hooks/useAuthUser';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeChat, updateChatMessage } from '../services/chatService';
import { initSocket, subscribeToMessages, subscribeToTypingStatus, sendTypingStatus } from '../utils/socketService';

const Chat = ({ clienteId, psicologoId, onClose }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const chatRef = useRef(null);
  
  // Determinar automáticamente si es cliente o psicólogo basado en los IDs proporcionados
  const userType = clienteId === localStorage.getItem('userId') ? 'clientes' : 'psicologos';
  const { cliente: usuarioActual, token } = useAuthUser(userType);
  const usuarioId = usuarioActual?.id;

  useEffect(() => {
    const setupChat = async () => {
      if (!clienteId || !psicologoId || !token) return;
      
      try {
        // Inicializar Socket.io
        initSocket(token);
        
        // Inicializar chat en Firebase
        const id = await initializeChat(clienteId, psicologoId);
        setChatId(id);
        
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
  }, [clienteId, psicologoId, token]);

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
      // Usar la función directamente del contexto actual
      const socket = initSocket(token);
      if (socket && socket.connected) {
        socket.emit('chat message', {
          chatId,
          content: mensaje,
          senderId: usuarioId,
          receptorId: userType === 'clientes' ? psicologoId : clienteId, // Si es cliente, envía al psicólogo y viceversa
          timestamp: new Date()
        });
      }
      
      setMensaje('');
      setArchivo(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar el mensaje');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Chat</h3>
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
            disabled={!mensaje.trim() && !archivo}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
