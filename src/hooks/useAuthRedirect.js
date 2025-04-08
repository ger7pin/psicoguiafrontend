'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const useAuthRedirect = (tipo) => {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${tipo}/verify`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          onsole.log('Error al verificar sesión:', data);
          setLogueado(true);
          // Redirige según el tipo
          if (tipo === 'clientes') {
            router.push('/clientes/dashboard');
          } else if (tipo === 'psicologos') {
            router.push('/psicologos/dashboard');
          }
        } else {
          setLogueado(false);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        setLogueado(false);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [tipo, router]);

  return { cargando, logueado };
};

export default useAuthRedirect;

