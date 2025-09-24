import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cliente Supabase para server-side rendering
 * Utiliza las cookies del servidor para autenticación
 * SOLO para usar en Server Components del App Router
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
