
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * Hook de autenticación actualizado para Supabase
 * ELIMINA: localStorage tokens (vulnerabilidad crítica)
 * IMPLEMENTA: Supabase Auth con httpOnly cookies (seguro)
 */
const useAuthUser = (userType) => {
  const [usuario, setUsuario] = useState(null);
  const [session, setSession] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // Función para obtener sesión actual
    const obtenerSesion = async () => {
      try {
        setCargando(true);
        setError(null);

        // Obtener sesión de Supabase (usa httpOnly cookies automáticamente)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          // No hay sesión activa
          if (isMounted) {
            setUsuario(null);
            setSession(null);
            setCargando(false);
          }
          return;
        }

        // Obtener datos completos del usuario desde nuestro backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Error verificando usuario');
        }

        const { data } = await response.json();
        
        // Verificar tipo de usuario si se especifica
        if (userType && data.user.tipo !== userType) {
          setError(`Usuario no es del tipo ${userType}`);
          return;
        }

        if (isMounted) {
          setUsuario(data.user);
          setSession(session);
          setCargando(false);
        }

      } catch (error) {
        console.error('❌ Error en autenticación:', error);
        if (isMounted) {
          setError(error.message);
          setUsuario(null);
          setSession(null);
          setCargando(false);
        }
      }
    };

    // Obtener sesión inicial
    obtenerSesion();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await obtenerSesion();
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUsuario(null);
            setSession(null);
            setCargando(false);
          }
        }
      }
    );

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [userType, router]);

  // Función para hacer login
  const login = async (email, password) => {
    try {
      setCargando(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setCargando(false);
    }
  };

  // Función para hacer logout
  const logout = async () => {
    try {
      setCargando(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error en logout:', error);
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Limpiar estado local
      setUsuario(null);
      setSession(null);
      
      // Redirigir a login
      router.push('/auth/login');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error en logout:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setCargando(false);
    }
  };

  // Función para registrar usuario
  const registro = async (userData) => {
    try {
      setCargando(true);
      setError(null);

      // Registrar en nuestro backend (que maneja Supabase Auth)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message);
        return { success: false, error: result.message };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error en registro:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setCargando(false);
    }
  };

  return {
    // Estado
    usuario,
    session,
    cargando,
    error,
    
    // Funciones
    login,
    logout,
    registro,
    
    // Propiedades de compatibilidad (para no romper código existente)
    cliente: usuario, // Alias para compatibilidad
    token: session?.access_token, // Token para APIs que lo requieran
    
    // Helpers
    isAuthenticated: !!session,
    isCliente: usuario?.tipo === 'cliente',
    isPsicologo: usuario?.tipo === 'psicologo',
    isAdmin: usuario?.tipo === 'admin'
  };
};

export default useAuthUser;
