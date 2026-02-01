import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { executeActionField, getActionFieldConfig } from '@/lib/action-fields'
import type { UserRole } from '@/lib/permissions'

/**
 * POST /api/deals/[id]/actions
 *
 * Execute an action field (button) on a deal
 *
 * Body:
 * {
 *   "field_name": "send_proposal",
 *   "context": {} // optional additional context
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')
  const userRole = (request.headers.get('x-user-role') || 'viewer') as UserRole

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing tenant context' },
      { status: 401 }
    )
  }

  const { id: dealId } = await params

  // Parse request body
  let body: { field_name: string; context?: Record<string, any> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { field_name, context: additionalContext } = body

  if (!field_name || typeof field_name !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid field_name' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Get current user ID
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: User not authenticated' },
      { status: 401 }
    )
  }

  // Fetch deal with tenant validation
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('tenant_id', tenantId)
    .single()

  if (dealError || !deal) {
    return NextResponse.json(
      { error: 'Deal not found' },
      { status: 404 }
    )
  }

  // Get action field configuration
  const config = await getActionFieldConfig(tenantId, 'deal', field_name)

  if (!config) {
    return NextResponse.json(
      {
        error: 'Action field not found',
        details: `Field "${field_name}" is not configured as an action field`,
      },
      { status: 404 }
    )
  }

  // Execute action
  const result = await executeActionField(
    {
      tenantId,
      userId: user.id,
      userRole,
      entityType: 'deal',
      entityId: dealId,
      fieldName: field_name,
      record: {
        ...deal,
        ...(additionalContext || {}),
      },
    },
    config
  )

  if (!result.success) {
    const statusCode = result.error?.includes('Permission') ? 403 : 500

    return NextResponse.json(
      {
        error: 'Action execution failed',
        details: result.error,
      },
      { status: statusCode }
    )
  }

  return NextResponse.json(
    {
      success: true,
      event_id: result.event_id,
      executed_at: result.executed_at,
      message: 'Action executed successfully',
    },
    { status: 200 }
  )
}
