import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from './src/lib/supabase'

/**
 * Middleware de Next.js para manejar autenticación con Supabase
 * - Intercepta todas las rutas
 * - Valida tokens de autenticación
 * - Refresca tokens automáticamente
 * - Redirige usuarios no autenticados
 */
export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareClient(request)
    
    // Refrescar la sesión si es necesario
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // Si hay error al obtener la sesión, limpiar cookies y redirigir
    if (error) {
      console.error('Error al obtener sesión:', error)
      const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url))
      
      // Limpiar cookies de autenticación
      redirectResponse.cookies.delete('sb-access-token')
      redirectResponse.cookies.delete('sb-refresh-token')
      
      return redirectResponse
    }

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    // Rutas públicas que no requieren autenticación
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ]

    // Rutas de autenticación que deben redirigir si el usuario ya está autenticado
    const authRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password'
    ]

    // Rutas protegidas que requieren autenticación
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/appointments',
      '/messages',
      '/settings'
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Si el usuario está autenticado
    if (session) {
      // Redirigir desde rutas de auth al dashboard
      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      // Permitir acceso a rutas protegidas y públicas
      return response
    }

    // Si el usuario NO está autenticado
    if (!session) {
      // Permitir acceso a rutas públicas
      if (isPublicRoute && !isProtectedRoute) {
        return response
      }
      
      // Redirigir rutas protegidas al login
      if (isProtectedRoute || (!isPublicRoute && pathname !== '/')) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  } catch (error) {
    console.error('Error en middleware:', error)
    
    // En caso de error, redirigir al login
    const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url))
    
    // Limpiar cookies de autenticación en caso de error
    redirectResponse.cookies.delete('sb-access-token')
    redirectResponse.cookies.delete('sb-refresh-token')
    
    return redirectResponse
  }
}

/**
 * Configuración del matcher para especificar qué rutas debe interceptar el middleware
 * Excluye archivos estáticos, API routes de Next.js y archivos de recursos
 */
export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     * - archivos con extensión (js, css, png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}