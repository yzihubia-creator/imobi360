import { NextRequest, NextResponse } from 'next/server'
import { dispatchEvents, dispatchEventsForTenant } from '@/lib/n8n/dispatcher'

/**
 * POST /api/webhooks/n8n/dispatch
 *
 * Triggers event dispatch to n8n
 * Can be called by:
 * - Cron jobs (Vercel Cron, GitHub Actions, etc.)
 * - Manual triggers
 * - Internal automation systems
 *
 * Optional query params:
 * - tenant_id: Process events for specific tenant only
 *
 * Authorization:
 * - Requires X-Dispatch-Secret header matching DISPATCH_SECRET env var
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const dispatchSecret = process.env.DISPATCH_SECRET
  const providedSecret = request.headers.get('x-dispatch-secret')

  if (!dispatchSecret || providedSecret !== dispatchSecret) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid dispatch secret' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')

  try {
    let result

    if (tenantId) {
      // Dispatch for specific tenant
      result = await dispatchEventsForTenant(tenantId)
    } else {
      // Dispatch all pending events
      result = await dispatchEvents()
    }

    const status = result.failed > 0 ? 207 : 200 // 207 Multi-Status if partial success

    return NextResponse.json(
      {
        success: true,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors,
      },
      { status }
    )
  } catch (error) {
    console.error('[DispatchAPI] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/n8n/dispatch
 *
 * Health check / status endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'n8n-event-dispatcher',
    status: 'ready',
    webhook_url_configured: !!process.env.N8N_WEBHOOK_URL,
    webhook_secret_configured: !!process.env.N8N_WEBHOOK_SECRET,
  })
}
