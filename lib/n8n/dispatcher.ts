import { createClient } from '@/lib/supabase/server'
import { sendWebhook } from './client'
import type { Database } from '@/src/types/supabase'

type EventRow = Database['public']['Tables']['events']['Row']

interface DispatchConfig {
  webhookUrl?: string
  webhookSecret?: string
  batchSize?: number
}

/**
 * Processes unprocessed events and dispatches them to n8n
 * Designed to be called by a cron job or background worker
 */
export async function dispatchEvents(
  config: DispatchConfig = {}
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const {
    webhookUrl = process.env.N8N_WEBHOOK_URL,
    webhookSecret = process.env.N8N_WEBHOOK_SECRET,
    batchSize = 100,
  } = config

  if (!webhookUrl) {
    console.warn('[N8nDispatcher] No webhook URL configured, skipping dispatch')
    return { processed: 0, failed: 0, errors: [] }
  }

  const supabase = await createClient()

  // Fetch unprocessed events (oldest first)
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (fetchError) {
    console.error('[N8nDispatcher] Failed to fetch events:', fetchError)
    return { processed: 0, failed: 0, errors: [fetchError.message] }
  }

  if (!events || events.length === 0) {
    return { processed: 0, failed: 0, errors: [] }
  }

  let processed = 0
  let failed = 0
  const errors: string[] = []

  // Process each event
  for (const event of events) {
    const result = await dispatchSingleEvent(event, webhookUrl, webhookSecret)

    if (result.success) {
      // Mark as processed
      await supabase
        .from('events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', event.id)

      processed++
    } else {
      failed++
      errors.push(`Event ${event.id}: ${result.error}`)

      // Log failure but don't block processing
      console.error(`[N8nDispatcher] Failed to dispatch event ${event.id}:`, result.error)

      // For critical failures, mark as processed to avoid infinite retries
      // Consider adding a retry_count field in production
      if (shouldMarkAsProcessedOnFailure(result.error)) {
        await supabase
          .from('events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', event.id)
      }
    }
  }

  return { processed, failed, errors }
}

/**
 * Dispatches a single event to n8n
 */
async function dispatchSingleEvent(
  event: EventRow,
  webhookUrl: string,
  webhookSecret?: string
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    tenant_id: event.tenant_id,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    event_type: event.event_type,
    event_id: event.id,
    payload: event.payload as Record<string, any>,
    timestamp: event.created_at || new Date().toISOString(),
  }

  return sendWebhook({
    url: webhookUrl,
    payload,
    secret: webhookSecret,
    retries: 3,
  })
}

/**
 * Determines if an event should be marked as processed despite failure
 * to prevent infinite retry loops
 */
function shouldMarkAsProcessedOnFailure(error?: string): boolean {
  if (!error) return false

  // Mark as processed for non-retryable errors
  const nonRetryablePatterns = [
    'HTTP 400',
    'HTTP 401',
    'HTTP 403',
    'HTTP 404',
    'HTTP 422',
    'Invalid',
    'Unauthorized',
  ]

  return nonRetryablePatterns.some((pattern) => error.includes(pattern))
}

/**
 * Dispatches events for a specific tenant
 * Useful for tenant-specific automation processing
 */
export async function dispatchEventsForTenant(
  tenantId: string,
  config: DispatchConfig = {}
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const {
    webhookUrl = process.env.N8N_WEBHOOK_URL,
    webhookSecret = process.env.N8N_WEBHOOK_SECRET,
    batchSize = 100,
  } = config

  if (!webhookUrl) {
    return { processed: 0, failed: 0, errors: [] }
  }

  const supabase = await createClient()

  // Fetch unprocessed events for tenant
  const { data: events, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (fetchError) {
    return { processed: 0, failed: 0, errors: [fetchError.message] }
  }

  if (!events || events.length === 0) {
    return { processed: 0, failed: 0, errors: [] }
  }

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const event of events) {
    const result = await dispatchSingleEvent(event, webhookUrl, webhookSecret)

    if (result.success) {
      await supabase
        .from('events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('id', event.id)

      processed++
    } else {
      failed++
      errors.push(`Event ${event.id}: ${result.error}`)

      if (shouldMarkAsProcessedOnFailure(result.error)) {
        await supabase
          .from('events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', event.id)
      }
    }
  }

  return { processed, failed, errors }
}
