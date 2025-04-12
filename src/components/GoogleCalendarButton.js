'use client';

import { useState } from 'react';

export default function GoogleCalendarButton({ isConnected, onConnectionChange }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/auth`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error al iniciar autenticación con Google:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="bg-gray-400 text-white px-4 py-2 rounded">
        Conectando...
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center text-green-600">
        <span className="mr-2">✓</span>
        Conectado con Google Calendar
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleAuth}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Conectar con Google Calendar
    </button>
  );
}
