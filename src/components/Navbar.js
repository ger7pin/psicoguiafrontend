'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FIRButton from '@/components/FIRButton'; // Ajusta la ruta si es necesario

export default function Navbar() {
  const [logueado, setLogueado] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const rutaActual = typeof window !== 'undefined' ? window.location.pathname : '';
  const tipo = rutaActual.includes('psicologos') ? 'psicologos' : 'clientes';

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${tipo}/verify`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.email) {
          setLogueado(true);
        } else {
          setLogueado(false);
        }
      } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        setLogueado(false);
      }
    };
  
    verificarSesion();
  }, [tipo]);
  
  

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${tipo}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setLogueado(false);
      router.push('/');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <button className="flex items-center transform transition-transform duration-200 hover:scale-105">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                PsicologíaApp
              </span>
            </button>
          </Link>

          {/* Navegación escritorio */}
          <div className="hidden md:flex items-center space-x-4">
            {logueado ? (
              <FIRButton onClick={handleLogout} variant="outline">
                Cerrar sesión
              </FIRButton>
            ) : (
              <>
                <FIRButton href="/clientes/login" variant="secondary">
                  Cliente
                </FIRButton>
                <FIRButton href="/psicologos/login" variant="secondary">
                  Psicólogo
                </FIRButton>
                <FIRButton href="/preregistro" variant="primary">
                  Registrarse
                </FIRButton>
              </>
            )}
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-2">
            {logueado ? (
              <FIRButton onClick={handleLogout} className="w-full text-left" variant="outline">
                Cerrar sesión
              </FIRButton>
            ) : (
              <>
                <FIRButton href="/clientes/login" className="w-full text-left" variant="secondary">
                  Cliente
                </FIRButton>
                <FIRButton href="/psicologos/login" className="w-full text-left" variant="secondary">
                  Psicólogo
                </FIRButton>
                <FIRButton href="/preregistro" className="w-full" variant="primary">
                  Registrarse
                </FIRButton>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
