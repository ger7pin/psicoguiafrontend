'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Verificar si ya se aceptaron las cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    // Guardar la preferencia del usuario
    localStorage.setItem('cookiesAccepted', 'true');
    setShowConsent(false);

    // Permitir cookies de terceros
    document.cookie = "SameSite=None; Secure";
    
    // Habilitar cookies para servicios específicos
    enableThirdPartyCookies();
  };

  const enableThirdPartyCookies = () => {
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }

    // Configuración para otros servicios de terceros
    const thirdPartyDomains = [
      '.google.com',
      '.doubleclick.net',
      '.google-analytics.com'
    ];

    thirdPartyDomains.forEach(domain => {
      document.cookie = `cookie_consent=true; path=/; domain=${domain}; SameSite=None; Secure`;
    });
  };

  const handleReject = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700 flex-grow">
          <p>
            Utilizamos cookies propias y de terceros para mejorar nuestros servicios 
            y mostrar publicidad relacionada con sus preferencias mediante el análisis 
            de sus hábitos de navegación. 
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
