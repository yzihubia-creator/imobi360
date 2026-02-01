import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/src/types/supabase'

type EventType = Database['public']['Enums']['event_type']
type EntityType = 'contact' | 'deal' | 'pipeline' | 'activity'

interface EmitEventParams {
  tenantId: string
  entityType: EntityType
  entityId: string
  eventType: EventType
  payload?: Record<string, any>
}

/**
 * Emits an event to the events table
 * Events are tenant-scoped and processed by the automation dispatcher
 */
export async function emitEvent({
  tenantId,
  entityType,
  entityId,
  eventType,
  payload = {},
}: EmitEventParams): Promise<{ success: boolean; error?: string; event_id?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .insert({
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
        event_type: eventType,
        payload,
        processed: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[EventEmitter] Failed to emit event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, event_id: data?.id }
  } catch (error) {
    console.error('[EventEmitter] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Emits a button click event
 * Used by dynamic fields engine for button fields
 */
export async function emitButtonClick({
  tenantId,
  entityType,
  entityId,
  buttonFieldName,
  metadata = {},
}: {
  tenantId: string
  entityType: EntityType
  entityId: string
  buttonFieldName: string
  metadata?: Record<string, any>
}): Promise<{ success: boolean; error?: string; event_id?: string }> {
  return emitEvent({
    tenantId,
    entityType,
    entityId,
    eventType: 'updated',
    payload: {
      action: 'button_click',
      field_name: buttonFieldName,
      ...metadata,
    },
  })
}

/**
 * Emits a stage change event for deals
 */
export async function emitStageChange({
  tenantId,
  dealId,
  fromStageId,
  toStageId,
  fromStageName,
  toStageName,
}: {
  tenantId: string
  dealId: string
  fromStageId: string
  toStageId: string
  fromStageName?: string
  toStageName?: string
}): Promise<{ success: boolean; error?: string; event_id?: string }> {
  return emitEvent({
    tenantId,
    entityType: 'deal',
    entityId: dealId,
    eventType: 'stage_changed',
    payload: {
      from_stage_id: fromStageId,
      to_stage_id: toStageId,
      from_stage_name: fromStageName,
      to_stage_name: toStageName,
    },
  })
}

/**
 * Emits a status change event for deals
 */
export async function emitStatusChange({
  tenantId,
  dealId,
  fromStatus,
  toStatus,
}: {
  tenantId: string
  dealId: string
  fromStatus: string
  toStatus: string
}): Promise<{ success: boolean; error?: string; event_id?: string }> {
  return emitEvent({
    tenantId,
    entityType: 'deal',
    entityId: dealId,
    eventType: 'status_changed',
    payload: {
      from_status: fromStatus,
      to_status: toStatus,
    },
  })
}
