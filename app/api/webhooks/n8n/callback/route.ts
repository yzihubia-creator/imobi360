import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSignature } from '@/lib/n8n/client'

/**
 * POST /api/webhooks/n8n/callback
 *
 * Receives callbacks from n8n workflows
 * Used for:
 * - Automation confirmations
 * - Workflow completion notifications
 * - Error reporting from n8n
 *
 * Validates HMAC signature to ensure authenticity
 */
export async function POST(request: NextRequest) {
  const secret = process.env.N8N_WEBHOOK_SECRET

  if (!secret) {
    console.warn('[N8nCallback] No webhook secret configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get signature from header
  const signature = request.headers.get('x-webhook-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing webhook signature' },
      { status: 401 }
    )
  }

  // Get raw body for signature validation
  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Validate signature
  const isValid = validateWebhookSignature(body, signature, secret)

  if (!isValid) {
    console.warn('[N8nCallback] Invalid webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse validated body
  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Process callback
  console.log('[N8nCallback] Received callback:', {
    event_id: payload.event_id,
    status: payload.status,
    workflow_id: payload.workflow_id,
  })

  // Here you can:
  // - Log workflow execution results
  // - Update automation run history
  // - Trigger follow-up actions
  // - Store execution metadata

  return NextResponse.json(
    {
      success: true,
      message: 'Callback received',
    },
    { status: 200 }
  )
}

/**
 * GET /api/webhooks/n8n/callback
 *
 * Health check for n8n callback endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'n8n-callback-receiver',
    status: 'ready',
    signature_validation_enabled: !!process.env.N8N_WEBHOOK_SECRET,
  })
}
