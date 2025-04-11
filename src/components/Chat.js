import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { Sonner } from 'sonner';
import { useAuthUser } from '../hooks/useAuthUser';

const Chat = ({ contacto }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [contactoEscribiendo, setContactoEscribiendo] = useState(false);
  const [socket, setSocket] = useState(null);
  const chatRef = useRef(null);
  const timeoutRef = useRef(null);
  const { user, token } = useAuthUser();
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor de Socket.IO');
    });

    newSocket.on('nuevoMensaje', handleNuevoMensaje);
    newSocket.on('usuarioEscribiendo', handleUsuarioEscribiendo);
    newSocket.on('estadoMensaje', handleEstadoMensaje);
    newSocket.on('nuevaReaccion', handleNuevaReaccion);

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  useEffect(() => {
    if (contacto?.id) {
      cargarMensajes();
    }
  }, [contacto]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const cargarMensajes = async () => {
    try {
      const response = await fetch(`/api/mensajes?contactoId=${contacto.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMensajes(data);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      Sonner.error('Error al cargar los mensajes');
    }
  };

  const handleNuevoMensaje = (data) => {
    setMensajes(prev => [...prev, data.mensaje]);
    new Audio('/sounds/notification.mp3').play();
    if (Notification.permission === 'granted') {
      new Notification('Nuevo mensaje', {
        body: data.mensaje.contenido,
        icon: '/icons/chat-icon.png'
      });
    }
  };

  const handleUsuarioEscribiendo = (data) => {
    if (data.emisorId === contacto.id) {
      setContactoEscribiendo(data.escribiendo);
    }
  };

  const handleEstadoMensaje = (data) => {
    setMensajes(prev => prev.map(m => 
      m.id === data.mensajeId ? { ...m, estado: data.estado } : m
    ));
  };

  const handleNuevaReaccion = (data) => {
    setMensajes(prev => prev.map(m => 
      m.id === data.mensajeId ? { ...m, reacciones: data.reacciones } : m
    ));
  };

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
    
    socket?.emit('escribiendo', { receptorId: contacto.id });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      socket?.emit('dejoDeEscribir', { receptorId: contacto.id });
    }, 1000);
  };

  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 31457280) { // 30MB
      setArchivo(file);
    } else {
      Sonner.error('El archivo excede el tamaño máximo permitido (30MB)');
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMensaje(prev => prev + emojiData.emoji);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() && !archivo) return;

    const formData = new FormData();
    if (mensaje.trim()) formData.append('contenido', mensaje.trim());
    if (archivo) formData.append('archivo', archivo);

    try {
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setMensaje('');
      setArchivo(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket?.emit('dejoDeEscribir', { receptorId: contacto.id });
    } catch (error) {
      console.error('Error:', error);
      Sonner.error('Error al enviar el mensaje');
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    try {
      await fetch(`/api/mensajes/${mensajeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      setMensajes(prev => prev.filter(m => m.id !== mensajeId));
    } catch (error) {
      console.error('Error:', error);
      Sonner.error('Error al eliminar el mensaje');
    }
  };

  const agregarReaccion = async (mensajeId, reaccion) => {
    try {
      await fetch(`/api/mensajes/${mensajeId}/reacciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaccion })
      });
    } catch (error) {
      console.error('Error:', error);
      Sonner.error('Error al agregar reacción');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center p-4 border-b">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{contacto.nombre}</h3>
          {contactoEscribiendo && (
            <p className="text-sm text-gray-500">Escribiendo...</p>
          )}
        </div>
      </div>
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.emisorId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.emisorId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <p>{msg.contenido}</p>
              {msg.archivoUrl && (
                <div className="mt-2">
                  {msg.archivoTipo.startsWith('image/') ? (
                    <img 
                      src={msg.archivoUrl} 
                      alt="Imagen adjunta"
                      className="max-w-full rounded"
                    />
                  ) : (
                    <a 
                      href={msg.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                    >
                      Ver archivo adjunto
                    </a>
                  )}
                </div>
              )}
              <div className="flex mt-2 space-x-1">
                {Object.entries(msg.reacciones || {}).map(([userId, reaccion]) => (
                  <span key={userId}>{reaccion}</span>
                ))}
              </div>
              <div className="text-xs mt-1 text-right">
                {msg.emisorId === user.id && (
                  <span>
                    {msg.estado === 'enviado' && '✓'}
                    {msg.estado === 'recibido' && '✓✓'}
                    {msg.estado === 'leido' && '✓✓ 👁️'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
          <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700">
            <input
              type="file"
              className="hidden"
              onChange={handleArchivoChange}
              accept="image/*,.pdf,.doc,.docx,.mp3,.wav,.mp4"
            />
            📎
          </label>
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
