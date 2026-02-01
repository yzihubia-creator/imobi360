import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/src/types/supabase'
import type { AuditLogEntry } from './types'

type EventRow = Database['public']['Tables']['events']['Row']
type EventType = Database['public']['Enums']['event_type']

/**
 * Fetch audit log entries for a specific record
 * SERVER-ONLY: This function should only be called from API routes
 *
 * @param tenantId - Tenant ID for isolation
 * @param entityType - Type of entity (deal, contact)
 * @param entityId - ID of the specific record
 * @param limit - Maximum number of entries to return (default: 50)
 */
export async function fetchAuditLog(
  tenantId: string,
  entityType: 'deal' | 'contact',
  entityId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  try {
    const supabase = await createClient()

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[AuditLog] Failed to fetch events:', error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    // Normalize events to audit log entries
    return events.map((event) => normalizeEvent(event))
  } catch (error) {
    console.error('[AuditLog] Unexpected error:', error)
    return []
  }
}

/**
 * Normalize raw event to human-readable audit log entry
 */
function normalizeEvent(event: EventRow): AuditLogEntry {
  const payload = (event.payload || {}) as Record<string, any>
  const timestamp = event.created_at || new Date().toISOString()

  // Base entry
  const entry: AuditLogEntry = {
    id: event.id,
    timestamp,
    eventType: event.event_type,
    actor: determineActor(payload),
    action: '',
    metadata: payload,
  }

  // Map event type to action description
  switch (event.event_type) {
    case 'created':
      entry.action = 'Created record'
      break

    case 'updated':
      // Check if this is a button click
      if (payload.action === 'button_click') {
        entry.action = `Clicked button: ${payload.field_name || 'Unknown'}`
        entry.field = payload.field_name
      } else if (payload.updated_fields && Array.isArray(payload.updated_fields)) {
        // General field update
        const fields = payload.updated_fields.join(', ')
        entry.action = `Updated fields: ${fields}`
      } else {
        entry.action = 'Updated record'
      }
      break

    case 'deleted':
      entry.action = 'Deleted record'
      break

    case 'stage_changed':
      const fromStage = payload.from_stage_name || 'Unknown'
      const toStage = payload.to_stage_name || 'Unknown'
      entry.action = `Changed stage from "${fromStage}" to "${toStage}"`
      entry.oldValue = fromStage
      entry.newValue = toStage
      break

    case 'status_changed':
      const fromStatus = payload.from_status || 'Unknown'
      const toStatus = payload.to_status || 'Unknown'
      entry.action = `Changed status from "${fromStatus}" to "${toStatus}"`
      entry.oldValue = fromStatus
      entry.newValue = toStatus
      break

    default:
      entry.action = `${event.event_type} event`
  }

  return entry
}

/**
 * Determine actor from event payload
 * Returns "System" if no user information is present
 */
function determineActor(payload: Record<string, any>): string {
  // Check for user information in payload
  if (payload.user_name) {
    return payload.user_name
  }

  if (payload.user_email) {
    return payload.user_email
  }

  if (payload.user_id) {
    return `User ${payload.user_id.substring(0, 8)}`
  }

  // Check for automation/system indicators
  if (payload.automation_id || payload.webhook_id) {
    return 'Automation'
  }

  return 'System'
}
