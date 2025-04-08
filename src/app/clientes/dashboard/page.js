'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import Chat from '@/components/Chat';

export default function ClienteDashboard() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useAuthRedirect('/clientes/login');

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clientes/verify`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('No autorizado');

        const data = await res.json();
        setEmail(data.email);
        setUserId(data.id); // Guarda el id para pasarlo al Chat

      } catch (err) {
        console.error('Error de autenticación:', err);
        router.push('/clientes/login');
      }
    };

    verificarToken();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-indigo-600">Bienvenido, cliente</h1>
          <p className="text-gray-700">Tu correo electrónico es: <strong>{email}</strong></p>

          {userId && (
            <Chat
              emisorId={userId}
              receptorId={5} // 👈 Reemplaza con el ID real del psicólogo
              tipoEmisor="cliente"
              token="" // Ya no usamos el token aquí directamente
            />
          )}
        </div>
      </div>
    </>
  );
}
