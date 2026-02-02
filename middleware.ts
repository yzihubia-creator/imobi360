/**
 * Middleware - Authentication & Tenant Isolation
 *
 * CRITICAL: This middleware runs ONLY on private routes (/dashboard/*, /profile)
 *
 * Flow:
 * 1. Not authenticated → redirect to /login
 * 2. Authenticated but no tenant → redirect to /onboarding
 * 3. Authenticated with tenant → inject headers and allow access
 *
 * Public routes (/login, /auth/*, /onboarding) bypass middleware entirely.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/src/types/supabase'
import type { UserRole } from '@/lib/permissions'

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Step 1: Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Step 2: Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Step 3: Get user's tenant from database
  const { data: userRecord } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  // Step 4: No tenant → redirect to onboarding
  if (!userRecord || !userRecord.tenant_id) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Step 5: Check module access for /dashboard/[module] routes
  const moduleMatch = request.nextUrl.pathname.match(/^\/dashboard\/([^\/]+)/)

  if (moduleMatch) {
    const requestedModule = moduleMatch[1]

    console.log('[Middleware] 🔐 Module access check:', {
      module: requestedModule,
      tenant_id: userRecord.tenant_id,
      user_role: userRecord.role,
      path: request.nextUrl.pathname
    })

    // Load tenant config to check module status
    const { loadTenantConfig } = await import('@/lib/tenant-config')

    try {
      const config = await loadTenantConfig(userRecord.tenant_id)

      // Find the module in config
      const module = config.modules.find(m => {
        // Match by module ID or by route
        return m.id === requestedModule || m.route === `/dashboard/${requestedModule}`
      })

      console.log('[Middleware] 📋 Module found:', {
        exists: !!module,
        enabled: module?.enabled,
        label: module?.label,
        route: module?.route
      })

      // If module doesn't exist or is disabled, redirect to first enabled module
      if (!module || !module.enabled) {
        const { getDashboardRedirectUrl } = await import('@/lib/first-run')
        const redirectUrl = getDashboardRedirectUrl(config, userRecord.role as UserRole)
        console.log('[Middleware] ⚠️ Access DENIED - Redirecting to:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }

      // Check RBAC using module validation
      const { canAccessModule } = await import('@/lib/modules/validation')
      const hasAccess = canAccessModule(requestedModule, config, userRecord.role as UserRole)

      if (!hasAccess) {
        const { getDashboardRedirectUrl } = await import('@/lib/first-run')
        const redirectUrl = getDashboardRedirectUrl(config, userRecord.role as UserRole)
        console.log('[Middleware] 🚫 RBAC DENIED - Redirecting to:', redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }

      console.log('[Middleware] ✅ Access GRANTED')
    } catch (error) {
      console.error('[Middleware] ❌ Failed to validate module access:', error)
      // On error, redirect to dashboard home (will handle redirect from there)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Step 6: Has tenant → inject headers and allow access
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', userRecord.tenant_id)

  if (userRecord.role) {
    requestHeaders.set('x-user-role', userRecord.role)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
}
