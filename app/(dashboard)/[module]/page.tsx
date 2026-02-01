/**
 * Dynamic Module Route
 *
 * Renders module content based on [module] route param.
 * Validates module access and enforces RBAC.
 *
 * Route: /dashboard/[module]
 * Examples: /dashboard/deals, /dashboard/contacts, /dashboard/leads
 */

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadTenantConfig } from '@/lib/tenant-config'
import { validateModuleAccess } from '@/lib/modules/validation'
import { getModuleViewWithFallback } from '@/lib/modules/registry'
import type { UserRole } from '@/lib/permissions'

interface ModulePageProps {
  params: Promise<{
    module: string
  }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { module: moduleId } = await params

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get user's tenant and role
  const { data: userRecord } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!userRecord) {
    notFound()
  }

  const tenantId = userRecord.tenant_id
  const userRole = (userRecord.role || 'viewer') as UserRole

  // Load tenant configuration
  let tenantConfig
  try {
    tenantConfig = await loadTenantConfig(tenantId)
  } catch (error) {
    console.error('[ModulePage] Failed to load tenant config:', error)
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load tenant configuration. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Validate module access
  const validation = validateModuleAccess(moduleId, tenantConfig, userRole)

  if (!validation.valid) {
    const errorMessages = {
      MODULE_NOT_CONFIGURED: {
        title: 'Module Not Found',
        description: validation.error?.message || 'This module is not available.',
      },
      MODULE_DISABLED: {
        title: 'Module Disabled',
        description: validation.error?.message || 'This module is currently disabled.',
      },
      UNAUTHORIZED: {
        title: 'Access Denied',
        description: validation.error?.message || 'You do not have permission to access this module.',
      },
      MODULE_NOT_FOUND: {
        title: 'Module Not Found',
        description: 'The requested module does not exist.',
      },
    }

    const errorCode = validation.error?.code || 'MODULE_NOT_FOUND'
    const errorInfo = errorMessages[errorCode]

    // Return 403 for unauthorized, 404 for not found/disabled
    if (errorCode === 'UNAUTHORIZED') {
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">{errorInfo.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{errorInfo.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Your role: {userRole}
            </p>
          </div>
        </div>
      )
    }

    // 404 for not found or disabled
    notFound()
  }

  // Get module view component
  const registryEntry = getModuleViewWithFallback(moduleId)
  const ModuleViewComponent = registryEntry.component

  // Render module view with validated config
  return (
    <ModuleViewComponent
      tenantId={tenantId}
      userRole={userRole}
      moduleConfig={validation.moduleConfig!}
    />
  )
}
