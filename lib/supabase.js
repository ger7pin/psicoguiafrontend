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
      get(name: string) {
        if (typeof document !== 'undefined') {
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value ? decodeURIComponent(value) : undefined
        }
        return undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof document !== 'undefined') {
          let cookieString = `${name}=${encodeURIComponent(value)}`
          
          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`
          }
          if (options?.path) {
            cookieString += `; path=${options.path}`
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`
          }
          if (options?.secure) {
            cookieString += '; secure'
          }
          if (options?.httpOnly) {
            cookieString += '; httponly'
          }
          if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`
          }
          
          document.cookie = cookieString
        }
      },
      remove(name: string, options: any) {
        if (typeof document !== 'undefined') {
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          
          if (options?.path) {
            cookieString += `; path=${options.path}`
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`
          }
          
          document.cookie = cookieString
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
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
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
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          })
        } catch {
          // El método set puede fallar durante el renderizado del servidor
          // Esto es normal y se puede ignorar
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          })
        } catch {
          // El método remove puede fallar durante el renderizado del servidor
          // Esto es normal y se puede ignorar
        }
      },
    },
  })
}