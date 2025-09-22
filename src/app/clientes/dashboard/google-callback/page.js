'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Obtener el código de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          throw new Error('No se recibió el código de autorización');
        }

        // Enviar el código al backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/callback`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        // Redirigir al dashboard con el parámetro de éxito
        router.replace('/clientes/dashboard?google_connected=true');
      } catch (error) {
        console.error('Error en el callback:', error);
        router.replace('/clientes/dashboard?error=google_auth_failed');
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Conectando con Google Calendar...</p>
      </div>
    </div>
  );
}
