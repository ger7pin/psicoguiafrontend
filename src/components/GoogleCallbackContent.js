'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // rol (cliente o psicologo)

        if (!code) {
          console.error('No se recibió código de autorización');
          router.push('/error?message=Fallo en la autenticación de Google');
          return;
        }

        // Enviar el código al backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          throw new Error('Error al procesar la autenticación');
        }

        const data = await response.json();
        
        // Redirigir al dashboard correspondiente
        router.push(`/${state}/dashboard?google_connected=true`);
      } catch (error) {
        console.error('Error en el callback:', error);
        router.push('/error?message=Error al conectar con Google Calendar');
      }
    }

    if (searchParams) {
      handleCallback();
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Procesando autenticación de Google...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}