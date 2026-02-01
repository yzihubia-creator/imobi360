'use client'

import { useMemo } from 'react'
import { checkPermission, checkFieldPermissions } from '@/lib/permissions'
import type { UserRole, EntityType, PermissionAction } from '@/lib/permissions'

interface UsePermissionsOptions {
  userRole: UserRole
  entityType: EntityType
}

/**
 * Hook to check field-level permissions in React components
 */
export function usePermissions({ userRole, entityType }: UsePermissionsOptions) {
  /**
   * Check if user can perform action on a specific field
   */
  const canAccess = useMemo(
    () => (field: string, action: PermissionAction) => {
      const result = checkPermission(
        { userRole, entityType, field },
        action
      )
      return result.allowed
    },
    [userRole, entityType]
  )

  /**
   * Check if user can write to a field
   */
  const canEdit = useMemo(
    () => (field: string) => canAccess(field, 'write'),
    [canAccess]
  )

  /**
   * Check if user can read a field
   */
  const canView = useMemo(
    () => (field: string) => canAccess(field, 'read'),
    [canAccess]
  )

  /**
   * Get permission results for multiple fields
   */
  const checkFields = useMemo(
    () => (fields: string[], action: PermissionAction) => {
      return checkFieldPermissions({ userRole, entityType }, fields, action)
    },
    [userRole, entityType]
  )

  /**
   * Check if user is admin (full access)
   */
  const isAdmin = userRole === 'admin'

  /**
   * Check if user is viewer (read-only)
   */
  const isViewer = userRole === 'viewer'

  return {
    canAccess,
    canEdit,
    canView,
    checkFields,
    isAdmin,
    isViewer,
  }
}
