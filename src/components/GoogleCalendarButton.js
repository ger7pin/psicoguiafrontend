'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCalendarButton() {
  
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un parámetro de conexión en la URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google_connected') === 'true') {
        setIsConnected(true);
        // Corregir la URL de redirección
        router.replace('/clientes/dashboard'); // Note el plural en "clientes"
      }
    }
  }, [router]);

  const handleConnect = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/auth`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Error al conectar con Google Calendar');
      
      const data = await response.json();
      // Redirigir al usuario a la URL de autorización de Google
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Error:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={handleConnect}
        className="w-full flex items-center justify-center gap-3 
                 bg-gradient-to-r from-blue-600 to-blue-800
                 hover:from-blue-700 hover:to-blue-900
                 text-white font-semibold py-3 px-6 rounded-xl
                 shadow-lg transition duration-200 ease-in-out
                 transform hover:scale-[1.02] hover:shadow-xl
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {/* Ícono de Google en blanco */}
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
        <span>Conectar con Google Calendar</span>
      </button>
      
      <p className="mt-2 text-sm text-center text-gray-600">
        Mantén tus citas sincronizadas automáticamente
      </p>
    </div>
  );
}
