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
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')

  // Redirect unauthenticated users to login
  if (!user && (isDashboardRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check onboarding completion for authenticated users
  if (user) {
    const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id

    if (tenantId) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('onboarding_completed_at, status')
        .eq('id', tenantId)
        .single()

      const onboardingCompleted =
        tenant?.onboarding_completed_at !== null ||
        tenant?.status === 'active'

      // Redirect to onboarding if not completed and trying to access dashboard
      if (!onboardingCompleted && isDashboardRoute) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Redirect to dashboard if onboarding already completed and trying to access onboarding
      if (onboardingCompleted && isOnboardingRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect to dashboard if trying to access login when authenticated and onboarded
      if (onboardingCompleted && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect to onboarding if trying to access login when authenticated but not onboarded
      if (!onboardingCompleted && isAuthRoute) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Inject tenant_id and user_role into request headers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-tenant-id', tenantId)

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
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
    '/onboarding',
  ],
}
