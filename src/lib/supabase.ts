import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cliente Supabase para componentes del lado del cliente
 * Utiliza cookies httpOnly para almacenar tokens de forma segura
 */
export function createClient() {
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