import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Chat({ emisorId, receptorId, tipoEmisor, token }) {
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`);

  useEffect(() => {
    // Cargar historial
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${emisorId}/${receptorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMensajes(data);
        } else {
          console.warn('⚠️ Respuesta inesperada (no es un array):', data);
          setMensajes([]);
        }
      })
      .catch((err) => {
        console.error('❌ Error al obtener mensajes:', err);
        setMensajes([]);
      });

    // Escuchar nuevos mensajes por socket
    socket.on('chat message', (msg) => {
      if (
        (msg.emisorId === emisorId && msg.receptorId === receptorId) ||
        (msg.emisorId === receptorId && msg.receptorId === emisorId)
      ) {
        setMensajes((prev) => [...prev, msg]);
      }
    });

    return () => socket.disconnect();
  }, [emisorId, receptorId]);

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const nuevoMsg = {
      contenido: mensaje,
      emisorId,
      receptorId,
      tipoEmisor,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuevoMsg),
      });

      const msgGuardado = await res.json();
      socket.emit('chat message', msgGuardado);
      setMensaje('');
    } catch (err) {
      console.error('❌ Error al enviar mensaje:', err);
    }
  };

  return (
    <div className="mt-8 bg-gray-100 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Chat en tiempo real</h2>

      <div className="h-40 overflow-y-auto bg-white border rounded p-2 mb-2">
        {Array.isArray(mensajes) && mensajes.length > 0 ? (
          mensajes.map((msg, idx) => (
            <div key={idx} className="text-sm text-gray-800">
              <strong>{msg.tipoEmisor === tipoEmisor ? 'Yo' : 'Otro'}:</strong> {msg.contenido}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-sm text-center">No hay mensajes aún.</p>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe tu mensaje"
          className="flex-1 px-2 py-1 border rounded"
        />
        <button
          onClick={enviarMensaje}
          className="bg-indigo-600 text-white px-4 py-1 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
