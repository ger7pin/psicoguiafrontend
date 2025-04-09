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
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();

        if (res.ok && data.email) {
          setCliente(data); // ✅ corregido
        } else {
          router.push(`/${userType}/login`);
        }
      } catch (err) {
        console.warn('Sesión no activa. Redirigiendo...', err);
        router.push(`/${userType}/login`);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [userType, router]);

  return { cliente, cargando };
};

export default useAuthUser;
