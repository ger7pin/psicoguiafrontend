
/**
 * Servicio de autenticación actualizado para Supabase
 * Reemplaza localStorage con httpOnly cookies seguros
 */
import { createClient } from '@/lib/supabase';

const supabase = createClient();
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

class AuthService {
  
  /**
   * Iniciar sesión con email y contraseña
   */
  static async login(email, password) {
    try {
      // Login directo con Supabase (maneja cookies automáticamente)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Obtener datos completos del usuario desde nuestro backend
      const userResponse = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!userResponse.ok) {
        throw new Error('Error verificando usuario');
      }

      const userData = await userResponse.json();

      return {
        success: true,
        data: {
          user: userData.data.user,
          session: data.session
        }
      };

    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async registro(userData) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Error en registro:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout() {
    try {
      // Logout de Supabase (limpia cookies automáticamente)
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      // Notificar al backend (opcional, para logs)
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (backendError) {
        // No es crítico si falla
        console.warn('⚠️ Error notificando logout al backend:', backendError);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error en logout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener sesión actual
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: session
      };

    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static async isAuthenticated() {
    const sessionResult = await this.getCurrentSession();
    return sessionResult.success && sessionResult.data !== null;
  }

  /**
   * Obtener token de acceso actual
   */
  static async getAccessToken() {
    const sessionResult = await this.getCurrentSession();
    return sessionResult.success ? sessionResult.data?.access_token : null;
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      const token = await this.getAccessToken();
      
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      const response = await fetch(`${API_BASE}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          passwordActual: currentPassword,
          passwordNuevo: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login con Google OAuth
   */
  static async loginWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };

    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AuthService;
