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
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.email) {
          setCliente(data);
          setToken(data.token);
          setCargando(false);
        } else {
          // Solo redirigir si estamos en una ruta protegida
          if (window.location.pathname.includes('dashboard')) {
            router.replace(`/${userType}/login`);
          }
          setCargando(false);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        if (isMounted) {
          setCargando(false);
          // Solo redirigir si estamos en una ruta protegida
          if (window.location.pathname.includes('dashboard')) {
            router.replace(`/${userType}/login`);
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
