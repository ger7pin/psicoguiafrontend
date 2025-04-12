'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const useAuthUser = (userType) => {
  const [cliente, setCliente] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          setCargando(false);
          router.push(`/${userType}/login`);
          return;
        }

        const data = await res.json();
        if (data.email) {
          setCliente(data);
        } else {
          router.push(`/${userType}/login`);
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        router.push(`/${userType}/login`);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [userType, router]);

  return { cliente, cargando, token };
};

export default useAuthUser;
