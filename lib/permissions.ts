/**
 * Field-Level RBAC Permission System
 *
 * Single source of truth for all permission logic.
 * Extensible, type-safe, and framework-agnostic.
 */

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'
export type EntityType = 'deal' | 'lead' | 'contact'

/**
 * System fields that are managed by the application.
 * These fields have restricted edit permissions.
 */
const SYSTEM_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_at',
  'updated_at',
  'pipeline_id',
  'stage_id',
  'status',
  'closed_at',
])

/**
 * Fields that members can edit on deals and leads.
 * Intentionally limited to core business data.
 */
const MEMBER_EDITABLE_FIELDS = new Set([
  'title',
  'value',
  'expected_close_date',
  'assigned_to',
  'contact_id',
  'custom_fields',
])

/**
 * Fields that managers can edit on deals and leads.
 * Everything except system fields.
 */
const MANAGER_RESTRICTED_FIELDS = SYSTEM_FIELDS

/**
 * Permission check result with reason for debugging/UI feedback.
 */
export interface PermissionResult {
  allowed: boolean
  reason?: string
}

/**
 * Check if a user can edit a specific field.
 *
 * @param role - User's role in the tenant
 * @param entityType - Type of entity being edited
 * @param fieldKey - Field key being edited
 * @returns Permission result with allowed flag and optional reason
 */
export function canEditField(
  role: UserRole,
  entityType: EntityType,
  fieldKey: string
): PermissionResult {
  // Viewers have read-only access to everything
  if (role === 'viewer') {
    return {
      allowed: false,
      reason: 'Viewers have read-only access',
    }
  }

  // Admins can edit everything
  if (role === 'admin') {
    return { allowed: true }
  }

  // System fields are protected
  if (SYSTEM_FIELDS.has(fieldKey)) {
    return {
      allowed: false,
      reason: 'System fields cannot be edited',
    }
  }

  // Managers can edit all non-system fields
  if (role === 'manager') {
    return { allowed: true }
  }

  // Members can only edit specific fields
  if (role === 'member') {
    // For custom fields, check if the field key starts with the prefix
    const isCustomField = fieldKey === 'custom_fields' || fieldKey.startsWith('custom_fields.')

    if (MEMBER_EDITABLE_FIELDS.has(fieldKey) || isCustomField) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: 'Members can only edit basic fields',
    }
  }

  // Default deny for unknown roles
  return {
    allowed: false,
    reason: 'Unknown role or insufficient permissions',
  }
}

/**
 * Validate multiple field updates at once.
 * Returns the first forbidden field or null if all allowed.
 *
 * @param role - User's role in the tenant
 * @param entityType - Type of entity being edited
 * @param fieldKeys - Array of field keys to validate
 * @returns First forbidden field or null
 */
export function validateFieldUpdates(
  role: UserRole,
  entityType: EntityType,
  fieldKeys: string[]
): { forbiddenField: string; reason: string } | null {
  for (const fieldKey of fieldKeys) {
    const result = canEditField(role, entityType, fieldKey)

    if (!result.allowed) {
      return {
        forbiddenField: fieldKey,
        reason: result.reason || 'Permission denied',
      }
    }
  }

  return null
}

/**
 * Check if a user can perform a bulk operation.
 * Bulk operations require manager or admin role.
 *
 * @param role - User's role in the tenant
 * @returns Whether bulk operations are allowed
 */
export function canPerformBulkOperation(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Check if a user can delete an entity.
 * Deletion requires manager or admin role.
 *
 * @param role - User's role in the tenant
 * @returns Whether deletion is allowed
 */
export function canDelete(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Get all editable fields for a role and entity type.
 * Useful for generating UI or validation schemas.
 *
 * @param role - User's role in the tenant
 * @param entityType - Type of entity
 * @returns Set of editable field keys
 */
export function getEditableFields(
  role: UserRole,
  entityType: EntityType
): Set<string> {
  if (role === 'viewer') {
    return new Set()
  }

  if (role === 'admin') {
    // Admins can edit everything (but we don't enumerate all fields here)
    return new Set(['*'])
  }

  if (role === 'manager') {
    // Managers can edit all non-system fields
    return new Set(['*-system'])
  }

  if (role === 'member') {
    return new Set(MEMBER_EDITABLE_FIELDS)
  }

  return new Set()
}

/**
 * Check if a field is a system field.
 * System fields have special handling and restricted permissions.
 *
 * @param fieldKey - Field key to check
 * @returns Whether the field is a system field
 */
export function isSystemField(fieldKey: string): boolean {
  return SYSTEM_FIELDS.has(fieldKey)
}

/**
 * Validate update permissions for API routes.
 * Used by PATCH endpoints to enforce field-level permissions.
 *
 * @param context - User role and entity type context
 * @param updateData - Update payload to validate
 * @returns Validation result with forbidden fields
 */
export function validateUpdatePermissions(
  context: { userRole: UserRole; entityType: EntityType },
  updateData: Record<string, any>
): { valid: boolean; forbiddenFields: string[] } {
  const forbiddenFields: string[] = []

  for (const fieldKey of Object.keys(updateData)) {
    const result = canEditField(context.userRole, context.entityType, fieldKey)

    if (!result.allowed) {
      forbiddenFields.push(fieldKey)
    }
  }

  return {
    valid: forbiddenFields.length === 0,
    forbiddenFields,
  }
}
