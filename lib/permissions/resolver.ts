import type { PermissionContext, PermissionResult, PermissionAction } from './types'
import { canReadField, canWriteField } from './rules'

/**
 * Central permission resolver
 * Evaluates whether a user can perform an action on a field
 */
export function checkPermission(
  context: PermissionContext,
  action: PermissionAction
): PermissionResult {
  if (action === 'read') {
    return canReadField(context)
  }

  if (action === 'write') {
    return canWriteField(context)
  }

  return {
    allowed: false,
    reason: 'Unknown action',
  }
}

/**
 * Batch permission check for multiple fields
 * Returns a map of field -> permission result
 */
export function checkFieldPermissions(
  baseContext: Omit<PermissionContext, 'field'>,
  fields: string[],
  action: PermissionAction
): Record<string, PermissionResult> {
  const results: Record<string, PermissionResult> = {}

  for (const field of fields) {
    results[field] = checkPermission(
      { ...baseContext, field },
      action
    )
  }

  return results
}

/**
 * Validate update payload against permissions
 * Throws error if any field is not allowed
 */
export function validateUpdatePermissions(
  baseContext: Omit<PermissionContext, 'field'>,
  updateData: Record<string, any>
): { valid: boolean; forbiddenFields: string[] } {
  const forbiddenFields: string[] = []

  for (const field of Object.keys(updateData)) {
    const result = checkPermission(
      { ...baseContext, field },
      'write'
    )

    if (!result.allowed) {
      forbiddenFields.push(field)
    }
  }

  return {
    valid: forbiddenFields.length === 0,
    forbiddenFields,
  }
}

/**
 * Filter update data to only include allowed fields
 * Used for graceful degradation instead of throwing errors
 */
export function filterAllowedFields(
  baseContext: Omit<PermissionContext, 'field'>,
  updateData: Record<string, any>
): Record<string, any> {
  const allowedData: Record<string, any> = {}

  for (const [field, value] of Object.entries(updateData)) {
    const result = checkPermission(
      { ...baseContext, field },
      'write'
    )

    if (result.allowed) {
      allowedData[field] = value
    }
  }

  return allowedData
}
