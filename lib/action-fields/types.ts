import type { Database } from '@/src/types/supabase'

export type EntityType = 'deal' | 'contact'

export interface ActionFieldConfig {
  /**
   * Type of action to execute
   */
  action: 'webhook' | 'event'

  /**
   * Automation key for event routing
   * Used by n8n to identify workflow
   */
  automation_key?: string

  /**
   * Direct webhook URL (optional)
   * If not provided, uses default n8n webhook
   */
  webhook_url?: string

  /**
   * Payload template with placeholders
   * Variables: {record}, {user}, {tenant}, {context}
   */
  payload_template?: Record<string, any>

  /**
   * Button label (optional, falls back to field_label)
   */
  label?: string

  /**
   * Button variant (optional)
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'

  /**
   * Confirmation message before execution (optional)
   */
  confirm_message?: string

  /**
   * Minimum role required to execute (optional)
   * Falls back to field-level RBAC
   */
  required_role?: Database['public']['Enums']['user_role']
}

export interface ActionExecutionContext {
  tenantId: string
  userId: string
  userRole: Database['public']['Enums']['user_role']
  entityType: EntityType
  entityId: string
  fieldName: string
  record: Record<string, any>
}

export interface ActionExecutionResult {
  success: boolean
  event_id?: string
  error?: string
  executed_at?: string
}
