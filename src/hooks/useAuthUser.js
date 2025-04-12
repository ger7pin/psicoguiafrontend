'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const useAuthUser = (userType) => {
  const [cliente, setCliente] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const verificarSesion = async () => {
      try {
        console.log('Verificando sesión...');
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'  // Evitar caché
          }
        });

        const data = await res.json();
        console.log('Respuesta verify:', data);

        if (!isMounted) return;

        if (res.ok && data.email) {
          setCliente(data);
          setToken(data.token);
          setCargando(false);
        } else {
          if (window.location.pathname.includes('dashboard')) {
            console.log('Redirigiendo a login...');
            // Usar replace y shallow para optimizar la redirección
            router.replace(`/${userType}/login`, undefined, { shallow: true });
          }
          setCargando(false);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        if (isMounted) {
          setCargando(false);
          if (window.location.pathname.includes('dashboard')) {
            router.replace(`/${userType}/login`, undefined, { shallow: true });
          }
        }
      }
    };

    verificarSesion();

    return () => {
      isMounted = false;
    };
  }, [userType, router]);

  return { cliente, cargando, token };
};

export default useAuthUser;
