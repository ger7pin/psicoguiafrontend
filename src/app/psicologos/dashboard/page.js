'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import useAuthRedirect from '@/hooks/useAuthRedirect';
import Chat from '@/components/Chat';

export default function PsicologoDashboard() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useAuthRedirect('/psicologos/login');

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/psicologos/verify`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('No autorizado');

        const data = await res.json();
        setEmail(data.email);
        setUserId(data.id); // Guardamos el ID para el chat

      } catch (err) {
        console.error('Error de autenticación:', err);
        router.push('/psicologos/login');
      }
    };

    verificarToken();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-indigo-600">Bienvenido, psicólogo</h1>
          <p className="text-gray-700">Tu correo electrónico es: <strong>{email}</strong></p>

          {userId && (
            <Chat
              emisorId={userId}
              receptorId={3} // 👈 Reemplaza por el ID real del cliente con el que se está chateando
              tipoEmisor="psicologo"
              token="" // Ya no usamos el token aquí directamente
            />
          )}
        </div>
      </div>
    </>
  );
}

