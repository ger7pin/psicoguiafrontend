'use client';

import { useState, useEffect } from 'react';

export default function GoogleCalendarButton({ isConnected, onConnectionChange, userType = 'cliente' }) {
  const [loading, setLoading] = useState(false);

  // Notificar cambios en el estado de conexión
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/google/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userType }) // Pasar el tipo de usuario al backend
      });
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error al iniciar autenticación con Google:', error);
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">Conectando con Google Calendar...</span>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
        <div className="flex items-center space-x-3">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-green-700 font-medium">Conectado con Google Calendar</p>
            <p className="text-green-600 text-sm">
              {userType === 'psicologo' 
                ? 'Las citas de tus pacientes se sincronizarán automáticamente' 
                : 'Las citas se sincronizarán automáticamente'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleAuth}
      className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center space-x-3 transition-colors duration-200"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path d="M21.67,11H12.67V13.5H17.87C17.27,16.12 15,18 12.18,18C8.85,18 6.15,15.3 6.15,12C6.15,8.7 8.85,6 12.18,6C13.8,6 15.3,6.68 16.41,7.79L18.2,6C16.65,4.47 14.51,3.5 12.18,3.5C7.47,3.5 3.65,7.32 3.65,12C3.65,16.68 7.47,20.5 12.18,20.5C16.89,20.5 20.71,16.68 20.71,12C20.71,11.66 20.69,11.33 20.65,11H21.67Z" fill="#4285F4"/>
      </svg>
      <span>
        {userType === 'psicologo'
          ? 'Conectar tu calendario de Google' 
          : 'Conectar con Google Calendar'}
      </span>
    </button>
  );
}
