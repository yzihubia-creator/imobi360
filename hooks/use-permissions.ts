'use client'

import { useMemo } from 'react'
import { canEditField, validateFieldUpdates, type UserRole, type EntityType } from '@/lib/permissions'

interface UsePermissionsOptions {
  userRole: UserRole
  entityType: EntityType
}

/**
 * Hook to check field-level permissions in React components.
 * Thin wrapper around the centralized permission resolver.
 */
export function usePermissions({ userRole, entityType }: UsePermissionsOptions) {
  /**
   * Check if user can edit a specific field.
   */
  const canEdit = useMemo(
    () => (field: string) => {
      const result = canEditField(userRole, entityType, field)
      return result.allowed
    },
    [userRole, entityType]
  )

  /**
   * Get the permission check result with reason.
   * Useful for displaying tooltips or error messages.
   */
  const checkPermission = useMemo(
    () => (field: string) => {
      return canEditField(userRole, entityType, field)
    },
    [userRole, entityType]
  )

  /**
   * Validate multiple field updates at once.
   * Returns null if all allowed, or the first forbidden field.
   */
  const validateFields = useMemo(
    () => (fields: string[]) => {
      return validateFieldUpdates(userRole, entityType, fields)
    },
    [userRole, entityType]
  )

  /**
   * Check if user is admin (full access).
   */
  const isAdmin = userRole === 'admin'

  /**
   * Check if user is viewer (read-only).
   */
  const isViewer = userRole === 'viewer'

  /**
   * Check if user is manager.
   */
  const isManager = userRole === 'manager'

  /**
   * Check if user is member.
   */
  const isMember = userRole === 'member'

  return {
    canEdit,
    checkPermission,
    validateFields,
    isAdmin,
    isViewer,
    isManager,
    isMember,
    role: userRole,
  }
}
