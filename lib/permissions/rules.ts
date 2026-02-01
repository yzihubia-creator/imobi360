import type { PermissionContext, PermissionResult, UserRole } from './types'

/**
 * System fields that cannot be modified through standard edit flows
 */
const SYSTEM_FIELDS = new Set([
  'id',
  'tenant_id',
  'created_at',
  'updated_at',
])

/**
 * Fields that require admin or manager role
 */
const PRIVILEGED_FIELDS = new Set([
  'pipeline_id',
  'assigned_to',
])

/**
 * Fields editable by members
 */
const MEMBER_EDITABLE_FIELDS = new Set([
  'title',
  'value',
  'expected_close_date',
  'custom_fields',
  'name',
  'email',
  'phone',
  'source',
])

/**
 * Fields editable by managers (includes all member fields + privileged fields)
 */
const MANAGER_EDITABLE_FIELDS = new Set([
  ...MEMBER_EDITABLE_FIELDS,
  'stage_id',
  'status',
  'contact_id',
  'closed_at',
  'type',
])

/**
 * Check if a user can write to a specific field
 */
export function canWriteField(context: PermissionContext): PermissionResult {
  const { userRole, field, customFieldConfig } = context

  // System fields are never editable
  if (SYSTEM_FIELDS.has(field)) {
    return {
      allowed: false,
      reason: 'System field cannot be modified',
    }
  }

  // Admin has full access
  if (userRole === 'admin') {
    return { allowed: true }
  }

  // Viewers are read-only
  if (userRole === 'viewer') {
    return {
      allowed: false,
      reason: 'Viewer role has read-only access',
    }
  }

  // Handle custom fields
  if (field === 'custom_fields' || field.startsWith('custom_fields.')) {
    // Check if custom field has specific role requirement
    if (customFieldConfig?.requiredRole) {
      const hasRequiredRole = checkRoleHierarchy(
        userRole,
        customFieldConfig.requiredRole
      )
      if (!hasRequiredRole) {
        return {
          allowed: false,
          reason: `Field requires ${customFieldConfig.requiredRole} role or higher`,
        }
      }
    }

    // Check if custom field is explicitly non-editable
    if (customFieldConfig?.isEditable === false) {
      return {
        allowed: false,
        reason: 'Field is not editable',
      }
    }

    // By default, members can edit custom fields
    return { allowed: true }
  }

  // Manager permissions
  if (userRole === 'manager') {
    if (MANAGER_EDITABLE_FIELDS.has(field)) {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Field requires admin role',
    }
  }

  // Member permissions
  if (userRole === 'member') {
    if (MEMBER_EDITABLE_FIELDS.has(field)) {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Insufficient permissions to edit this field',
    }
  }

  return {
    allowed: false,
    reason: 'Unknown role',
  }
}

/**
 * Check if a user can read a specific field
 * Currently all authenticated users can read all fields within their tenant
 */
export function canReadField(context: PermissionContext): PermissionResult {
  // All roles can read all fields (within tenant scope)
  return { allowed: true }
}

/**
 * Check if a role has equal or higher privileges than required role
 */
function checkRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    member: 2,
    manager: 3,
    admin: 4,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get all fields a user can edit for an entity type
 */
export function getEditableFields(
  userRole: UserRole,
  entityType: 'deal' | 'contact'
): string[] {
  if (userRole === 'admin') {
    // Admin can edit everything except system fields
    if (entityType === 'deal') {
      return [
        'title',
        'value',
        'expected_close_date',
        'pipeline_id',
        'stage_id',
        'status',
        'contact_id',
        'assigned_to',
        'closed_at',
        'custom_fields',
      ]
    } else {
      return [
        'name',
        'email',
        'phone',
        'source',
        'type',
        'status',
        'assigned_to',
        'custom_fields',
      ]
    }
  }

  if (userRole === 'manager') {
    return Array.from(MANAGER_EDITABLE_FIELDS)
  }

  if (userRole === 'member') {
    return Array.from(MEMBER_EDITABLE_FIELDS)
  }

  return []
}
