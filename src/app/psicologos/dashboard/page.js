'use client';

import { useEffect, useState } from 'react';
import useAuthUser from '@/hooks/useAuthUser';
import Navbar from '@/components/Navbar';

export default function DashboardPsicologo() {
  const { psicologo, cargando } = useAuthUser('psicologo');
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (!cargando && psicologo) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setContactos(data))
        .catch(err => console.error('Error al obtener contactos:', err));
    }
  }, [psicologo, cargando]);

  const conectarGoogleCalendar = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/auth?rol=psicologo`;
  };

  if (cargando || !psicologo) return <p>Cargando...</p>;

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bienvenido/a, {psicologo.nombre}</h1>

        {/* Botón para conectar Google Calendar */}
        <div className="mb-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={conectarGoogleCalendar}
          >
            Conectar con Google Calendar
          </button>
        </div>

        {/* Lista de contactos */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Mis contactos</h2>
          <ul>
            {contactos.length === 0 ? (
              <p>No tienes contactos aún.</p>
            ) : (
              contactos.map((c) => {
                const cliente = c.cliente;
                return (
                  <li key={c.id} className="flex items-center gap-4 mb-3">
                    <img src={cliente.imagen} alt="avatar" className="w-10 h-10 rounded-full" />
                    <span className="text-lg">{cliente.nombre}</span>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
