'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const useAuthUser = (userType) => {
  const [cliente, setCliente] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [intentoVerificacion, setIntentoVerificacion] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // Obtener token guardado para el tipo de usuario actual
    const tokenGuardado = localStorage.getItem(`authToken_${userType}`) || localStorage.getItem('authToken');
    
    // Función auxiliar para determinar si debemos redireccionar
    const debeRedirigir = () => {
      // Solo redirigir si estamos realmente en el dashboard correspondiente al userType
      // y no cuando estamos en un dashboard diferente (por ejemplo, en el chat dentro del dashboard)
      if (!window.location.pathname.includes('dashboard')) {
        return false;
      }
      
      // Verificar si estamos en el dashboard correcto para el tipo de usuario
      const enDashboardPropioDeUsuario = window.location.pathname.includes(`/${userType}/dashboard`);
      return enDashboardPropioDeUsuario;
    };

    const verificarSesion = async () => {
      try {
        // Agregar el token guardado como header adicional para reforzar la autenticación
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };
        
        if (tokenGuardado) {
          headers['Authorization'] = `Bearer ${tokenGuardado}`;
        }

        console.log(`Verificando sesión para ${userType} (intento ${intentoVerificacion + 1})`);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${userType}/verify`, {
          method: 'GET',
          credentials: 'include',
          headers: headers
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.email) {
          // Sesión válida, guardar datos y token
          setCliente(data);
          setToken(data.token);
          
          // Si hay un nuevo token, guardarlo en localStorage
          if (data.token) {
            localStorage.setItem(`authToken_${userType}`, data.token);
            localStorage.setItem('authToken', data.token);
          }
          
          // Guardar el tipo de usuario para futuras referencias
          localStorage.setItem('userType', userType);
          if (data.id) {
            localStorage.setItem('userId', data.id);
          }
          
          setCargando(false);
        } else {
          // La sesión no es válida
          if (debeRedirigir()) {
            console.log(`Sesión inválida para ${userType}, redirigiendo a login`);
            router.replace(`/${userType}/login`);
          }
          setCargando(false);
        }
      } catch (error) {
        console.error(`Error verificando sesión para ${userType}:`, error);
        if (isMounted) {
          // Si es el primer intento, intentar de nuevo
          if (intentoVerificacion === 0) {
            setIntentoVerificacion(1);
            return; // Salir para que el siguiente efecto intente de nuevo
          }
          
          setCargando(false);
          if (debeRedirigir()) {
            console.log(`Error de verificación para ${userType}, redirigiendo a login`);
            router.replace(`/${userType}/login`);
          }
        }
      }
    };

    verificarSesion();

    return () => {
      isMounted = false;
    };
  }, [userType, router, intentoVerificacion]);

  return { cliente, cargando, token };
};

export default useAuthUser;
