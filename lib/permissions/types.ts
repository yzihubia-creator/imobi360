import type { Database } from '@/src/types/supabase'

export type UserRole = Database['public']['Enums']['user_role']
export type EntityType = 'deal' | 'contact'

export type PermissionAction = 'read' | 'write'

export interface PermissionContext {
  userRole: UserRole
  entityType: EntityType
  field: string
  isOwner?: boolean
  customFieldConfig?: {
    isEditable?: boolean
    requiredRole?: UserRole
  }
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
}

export type FieldPermissionRule = (context: PermissionContext) => PermissionResult
