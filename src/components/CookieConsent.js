'use client';

import { useState, useEffect } from 'react';
import FIRButton from './FIRButton';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Verificar si ya se aceptaron las cookies
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:p-6 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <p>
            Esta aplicación requiere cookies para funcionar correctamente. Las cookies nos permiten 
            mantener tu sesión activa y mejorar tu experiencia. En dispositivos móviles, es necesario 
            permitir cookies de terceros para el correcto funcionamiento.
          </p>
        </div>
        <div className="flex gap-4">
          <FIRButton onClick={handleAccept} variant="primary">
            Aceptar cookies
          </FIRButton>
          <a 
            href="/politica-cookies" 
            className="text-sm text-blue-600 hover:underline"
          >
            Más información
          </a>
        </div>
      </div>
    </div>
  );
}
