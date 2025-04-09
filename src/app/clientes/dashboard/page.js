'use client';

import { useEffect, useState } from 'react';
import useAuthUser from '@/hooks/useAuthUser'; // ⬅️ CAMBIO: nuevo hook
import Navbar from '@/components/Navbar';

export default function DashboardCliente() {
  const { cliente, cargando } = useAuthUser('clientes'); // ⬅️ CAMBIO
  const [contactos, setContactos] = useState([]);

  useEffect(() => {
    if (!cargando && cliente) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contactos`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setContactos(data))
        .catch(err => console.error('Error al obtener contactos:', err));
    }
  }, [cliente, cargando]);

  if (cargando) return <p>Cargando...</p>;

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bienvenido, {cliente.nombre}</h1>

        <section>
          <h2 className="text-xl font-semibold mb-3">Mis contactos</h2>
          <ul>
            {contactos.length === 0 ? (
              <p>No tienes contactos aún.</p>
            ) : (
              contactos.map((c) => {
                const psicologo = c.psicologo;
                return (
                  <li key={c.id} className="flex items-center gap-4 mb-3">
                    <img src={psicologo.imagen} alt="avatar" className="w-10 h-10 rounded-full" />
                    <span className="text-lg">{psicologo.nombre}</span>
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
