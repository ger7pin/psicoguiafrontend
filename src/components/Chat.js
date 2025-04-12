import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import useAuthUser from '../hooks/useAuthUser';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeChat, updateChatMessage } from '../services/chatService';

const Chat = ({ clienteId, psicologoId, onClose }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [chatId, setChatId] = useState(null);  // Añadir este estado
  const chatRef = useRef(null);
  const { cliente } = useAuthUser('clientes');

  useEffect(() => {
    const setupChat = async () => {
      if (!clienteId || !psicologoId) return;
      
      try {
        const id = await initializeChat(clienteId, psicologoId);
        setChatId(id);
        
        // Suscribirse a los mensajes
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

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al inicializar chat:', error);
        toast.error('Error al inicializar el chat');
      }
    };

    setupChat();
  }, [clienteId, psicologoId]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
  };

  const handleEmojiClick = (emojiData) => {
    setMensaje(prev => prev + emojiData.emoji);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() && !archivo) return;
    if (!cliente?.id) return toast.error('Error: Usuario no autenticado');
    if (!chatId) return toast.error('Error: Chat no inicializado');

    try {
      const messageData = {
        content: mensaje,
        senderId: cliente.id,
        timestamp: serverTimestamp()
      };

      // Añadir mensaje a la subcolección de mensajes
      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

      // Actualizar último mensaje en el documento principal del chat
      await updateChatMessage(chatId, messageData);
      
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
            className={`flex ${msg.senderId === cliente.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.senderId === cliente.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
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
