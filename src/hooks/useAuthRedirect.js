'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const useAuthRedirect = (userType) => {
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
          router.push(`/${userType}/dashboard`);
        }
      } catch (err) {
        console.warn('Sesión no activa. Continuar en login.');
      }
    };

    verificarSesion();
  }, [userType, router]);
};