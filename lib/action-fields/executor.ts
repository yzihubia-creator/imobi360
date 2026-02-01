import { createClient } from '@/lib/supabase/server'
import { emitButtonClick } from '@/lib/events/emitter'
import { canEditField } from '@/lib/permissions'
import { sendWebhook } from '@/lib/n8n/client'
import type {
  ActionExecutionContext,
  ActionExecutionResult,
  ActionFieldConfig,
} from './types'

/**
 * Execute an action field (button click)
 * Validates permissions, emits event, and dispatches to webhook
 */
export async function executeActionField(
  context: ActionExecutionContext,
  config: ActionFieldConfig
): Promise<ActionExecutionResult> {
  const { tenantId, userId, userRole, entityType, entityId, fieldName, record } =
    context

  // Validate permissions
  const permissionCheck = canEditField(userRole, entityType, fieldName)

  if (!permissionCheck.allowed) {
    return {
      success: false,
      error: permissionCheck.reason || 'Permission denied',
    }
  }

  // Check action-specific role requirement
  if (config.required_role) {
    if (!hasRequiredRole(userRole, config.required_role)) {
      return {
        success: false,
        error: `This action requires ${config.required_role} role or higher`,
      }
    }
  }

  try {
    // Build payload from template
    const payload = buildPayload(config.payload_template || {}, {
      record,
      user: { id: userId },
      tenant: { id: tenantId },
      context: {
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        automation_key: config.automation_key,
      },
    })

    // Emit event to events table
    const eventResult = await emitButtonClick({
      tenantId,
      entityType,
      entityId,
      buttonFieldName: fieldName,
      metadata: {
        automation_key: config.automation_key,
        user_id: userId,
        payload,
      },
    })

    if (!eventResult.success) {
      return {
        success: false,
        error: `Failed to emit event: ${eventResult.error}`,
      }
    }

    // Dispatch to webhook if configured
    if (config.action === 'webhook') {
      const webhookUrl = config.webhook_url || process.env.N8N_WEBHOOK_URL

      if (webhookUrl) {
        const webhookPayload = {
          tenant_id: tenantId,
          entity_type: entityType,
          entity_id: entityId,
          event_type: 'updated' as const,
          event_id: eventResult.event_id || '',
          payload: {
            action: 'button_click',
            field_name: fieldName,
            automation_key: config.automation_key,
            user_id: userId,
            ...payload,
          },
          timestamp: new Date().toISOString(),
        }

        const webhookResult = await sendWebhook({
          url: webhookUrl,
          payload: webhookPayload,
          secret: process.env.N8N_WEBHOOK_SECRET,
          retries: 1, // Single retry for button actions
        })

        if (!webhookResult.success) {
          // Event was created, but webhook failed
          // Log error but don't fail the action (async handling)
          console.error(
            `[ActionField] Webhook failed for ${fieldName}:`,
            webhookResult.error
          )
        }
      }
    }

    return {
      success: true,
      event_id: eventResult.event_id,
      executed_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[ActionField] Execution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get action field configuration from custom_fields table
 */
export async function getActionFieldConfig(
  tenantId: string,
  entityType: string,
  fieldName: string
): Promise<ActionFieldConfig | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('custom_fields')
      .select('options')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)
      .eq('field_name', fieldName)
      .eq('field_type', 'button' as any) // Type cast - 'button' will be added to enum later
      .single()

    if (error || !data) {
      return null
    }

    return (data.options as unknown as ActionFieldConfig) || null
  } catch (error) {
    console.error('[ActionField] Failed to fetch config:', error)
    return null
  }
}

/**
 * Build payload from template with variable substitution
 */
function buildPayload(
  template: Record<string, any>,
  variables: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string') {
      // Replace variables like {record.title}, {user.id}, etc.
      result[key] = replaceVariables(value, variables)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      result[key] = buildPayload(value, variables)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/\{([^}]+)\}/g, (match, path) => {
    const value = getNestedValue(variables, path)
    return value !== undefined ? String(value) : match
  })
}

/**
 * Get nested value from object by path (e.g., "record.title")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Check if user has required role (using role hierarchy)
 */
function hasRequiredRole(
  userRole: string,
  requiredRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    member: 2,
    manager: 3,
    admin: 4,
  }

  return (
    roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  )
}

/**
 * Validate action field configuration
 */
export function validateActionFieldConfig(
  config: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.action || !['webhook', 'event'].includes(config.action)) {
    errors.push('Invalid action type. Must be "webhook" or "event"')
  }

  if (config.action === 'webhook' && !config.webhook_url && !process.env.N8N_WEBHOOK_URL) {
    errors.push('Webhook action requires webhook_url or N8N_WEBHOOK_URL env var')
  }

  if (config.required_role && !['viewer', 'member', 'manager', 'admin'].includes(config.required_role)) {
    errors.push('Invalid required_role')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
