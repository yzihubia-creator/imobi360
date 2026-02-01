/**
 * Module Validation
 *
 * Server-side validation for module access.
 * Validates module existence, enablement, and RBAC.
 */

import type { TenantConfig } from '@/lib/templates/types'
import type { UserRole } from '@/lib/permissions'
import type { ModuleValidationResult } from './types'
import { getModuleView } from './registry'

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3,
}

/**
 * Validate module access
 *
 * Checks:
 * 1. Module exists in tenant config
 * 2. Module is enabled
 * 3. User has required role
 *
 * @param moduleId - Module identifier from route param
 * @param tenantConfig - Tenant runtime configuration
 * @param userRole - Current user's role
 * @returns Validation result with error details
 */
export function validateModuleAccess(
  moduleId: string,
  tenantConfig: TenantConfig,
  userRole: UserRole
): ModuleValidationResult {
  // 1. Check if module exists in tenant config
  const moduleConfig = tenantConfig.modules.find((m) => m.id === moduleId)

  if (!moduleConfig) {
    return {
      valid: false,
      error: {
        code: 'MODULE_NOT_CONFIGURED',
        message: `Module "${moduleId}" is not configured for this tenant`,
      },
    }
  }

  // 2. Check if module is enabled
  if (!moduleConfig.enabled) {
    return {
      valid: false,
      error: {
        code: 'MODULE_DISABLED',
        message: `Module "${moduleConfig.label}" is disabled`,
      },
    }
  }

  // 3. Check RBAC - get minimum role from registry
  const registryEntry = getModuleView(moduleId)
  const minRole = registryEntry?.minRole

  if (minRole) {
    const userLevel = ROLE_HIERARCHY[userRole]
    const requiredLevel = ROLE_HIERARCHY[minRole]

    if (userLevel < requiredLevel) {
      return {
        valid: false,
        error: {
          code: 'UNAUTHORIZED',
          message: `Insufficient permissions to access "${moduleConfig.label}". Required role: ${minRole}`,
        },
      }
    }
  }

  // All checks passed
  return {
    valid: true,
    moduleConfig,
  }
}

/**
 * Check if user can access module
 *
 * Quick boolean check without detailed error information.
 *
 * @param moduleId - Module identifier
 * @param tenantConfig - Tenant runtime configuration
 * @param userRole - Current user's role
 * @returns True if user can access module
 */
export function canAccessModule(
  moduleId: string,
  tenantConfig: TenantConfig,
  userRole: UserRole
): boolean {
  const result = validateModuleAccess(moduleId, tenantConfig, userRole)
  return result.valid
}
