import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/src/types/supabase'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/leads') ||
    request.nextUrl.pathname.startsWith('/imoveis') ||
    request.nextUrl.pathname.startsWith('/contratos') ||
    request.nextUrl.pathname.startsWith('/financeiro') ||
    request.nextUrl.pathname.startsWith('/analytics')

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  // Redireciona para login se não autenticado em rotas protegidas
  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redireciona para dashboard se já autenticado tentando acessar login
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Injeta tenant_id e user_role nos headers da requisição
  if (user) {
    const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id

    if (tenantId) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-tenant-id', tenantId)

      // Fetch user role from database
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .eq('tenant_id', tenantId)
        .single()

      if (userData?.role) {
        requestHeaders.set('x-user-role', userData.role)
      }

      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/imoveis/:path*',
    '/contratos/:path*',
    '/financeiro/:path*',
    '/analytics/:path*',
    '/login',
  ],
}
