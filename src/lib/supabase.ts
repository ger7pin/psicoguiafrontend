import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Validar variables de entorno de Supabase
function validateSupabaseEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    throw new Error(
      `@supabase/ssr: Your project's URL and API key are required to create a Supabase client! ` +
      `Missing environment variables: ${missingVars.join(', ')}. ` +
      `Please check your .env.local file or deployment environment variables.`
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Obtener variables de entorno validadas
function getSupabaseConfig() {
  // Solo validar en tiempo de ejecución, no durante el build
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
    return validateSupabaseEnvVars()
  }
  
  // Durante el build, usar valores por defecto si no están disponibles
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  }
}

/**
 * Cliente Supabase para componentes del lado del cliente
 * Utiliza cookies httpOnly para almacenar tokens de forma segura
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '@supabase/ssr: Cannot create client - Supabase environment variables are not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document !== 'undefined') {
          return document.cookie
            .split('; ')
            .map(cookie => {
              const [name, ...rest] = cookie.split('=')
              const value = rest.join('=')
              return { name, value: decodeURIComponent(value) }
            })
            .filter(cookie => cookie.name && cookie.value)
        }
        return []
      },
      setAll(cookiesToSet) {
        if (typeof document !== 'undefined') {
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            if (options.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options.path) {
              cookieString += `; path=${options.path}`
            }
            if (options.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options.secure) {
              cookieString += '; secure'
            }
            if (options.httpOnly) {
              cookieString += '; httponly'
            }
            if (options.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }
            
            document.cookie = cookieString
          })
        }
      },
    },
  })
}

/**
 * Cliente Supabase para middleware con manejo de cookies
 * Intercepta y maneja las cookies de autenticación en el middleware
 */
export function createMiddlewareClient(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({
            name,
            value,
            ...options,
          })
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        })
      },
    },
  })

  return { supabase, response }
}

/**
 * Cliente Supabase para server-side rendering
 * Utiliza las cookies del servidor para autenticación
 */
export async function createServerComponentClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          })
        } catch {
          // El método setAll puede fallar durante el renderizado del servidor
          // Esto es normal y se puede ignorar
        }
      },
    },
  })
}