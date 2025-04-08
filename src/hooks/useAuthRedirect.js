// hooks/useAuthRedirect.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const useAuthRedirect = (userType, setSesionActiva) => {
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include', // 👈 importante para cookies HttpOnly
        });
        const data = await res.json();
        if (res.ok && data.message === 'Sesión activa') {
          setSesionActiva(true);
          router.push(`/${userType}/dashboard`);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      }
    };

    verificarSesion();
  }, [userType, router, setSesionActiva]);
};

export default useAuthRedirect;


