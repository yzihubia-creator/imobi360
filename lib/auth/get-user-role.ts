import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/permissions'

/**
 * Get the authenticated user's role
 * Returns 'viewer' as safe default if not authenticated or role not found
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return 'viewer'
    }

    // Fetch user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.warn('[getUserRole] Failed to fetch user role:', userError)
      return 'viewer'
    }

    return userData.role as UserRole
  } catch (error) {
    console.error('[getUserRole] Unexpected error:', error)
    return 'viewer'
  }
}

/**
 * Get user role from tenant context
 * Includes tenant validation
 */
export async function getUserRoleForTenant(tenantId: string): Promise<UserRole> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return 'viewer'
    }

    // Fetch user role with tenant validation
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    if (userError || !userData) {
      console.warn('[getUserRoleForTenant] User not found in tenant:', userError)
      return 'viewer'
    }

    return userData.role as UserRole
  } catch (error) {
    console.error('[getUserRoleForTenant] Unexpected error:', error)
    return 'viewer'
  }
}
