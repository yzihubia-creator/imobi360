import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { emitEvent, emitStageChange, emitStatusChange } from '@/lib/events/emitter'
import { validateUpdatePermissions } from '@/lib/permissions'
import { resolveFormulaFields, isFormulaField } from '@/lib/formula-engine'
import { resolveRelationFields, isRelationField } from '@/lib/relation-engine'
import type { Database } from '@/src/types/supabase'
import type { UserRole } from '@/lib/permissions'

type DealUpdate = Database['public']['Tables']['deals']['Update']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing tenant context' },
      { status: 401 }
    )
  }

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, name, email, phone, type, status),
      pipeline:pipelines(id, name, is_default, is_active),
      stage:pipeline_stages(id, name, color, position, is_won, is_lost),
      assigned_user:users(id, name, email)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch deal', details: error.message },
      { status: 500 }
    )
  }

  // Resolve formula fields
  const formulaValues = await resolveFormulaFields(tenantId, 'deal', data)

  // Resolve relation fields
  const relationValues = await resolveRelationFields(tenantId, 'deal', data)

  // Merge computed values into response
  const enrichedData = {
    ...data,
    computed_fields: {
      ...formulaValues,
      ...relationValues,
    },
  }

  return NextResponse.json({ data: enrichedData }, { status: 200 })
}

export async function PATCH(
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

  const { id } = await params

  let body: Partial<DealUpdate>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Prevent tenant_id changes
  if (body.tenant_id && body.tenant_id !== tenantId) {
    return NextResponse.json(
      { error: 'Cannot change tenant_id' },
      { status: 403 }
    )
  }

  // Validate field-level permissions
  const permissionCheck = validateUpdatePermissions(
    { userRole, entityType: 'deal' },
    body
  )

  if (!permissionCheck.valid) {
    return NextResponse.json(
      {
        error: 'Permission denied',
        details: `You do not have permission to modify: ${permissionCheck.forbiddenFields.join(', ')}`,
        forbidden_fields: permissionCheck.forbiddenFields,
      },
      { status: 403 }
    )
  }

  // Block attempts to update formula or relation fields
  const computedFieldAttempts: string[] = []
  for (const fieldName of Object.keys(body)) {
    const isFormula = await isFormulaField(tenantId, 'deal', fieldName)
    const isRelation = await isRelationField(tenantId, 'deal', fieldName)

    if (isFormula || isRelation) {
      computedFieldAttempts.push(fieldName)
    }
  }

  if (computedFieldAttempts.length > 0) {
    return NextResponse.json(
      {
        error: 'Cannot update computed fields',
        details: `Computed fields are read-only: ${computedFieldAttempts.join(', ')}`,
        computed_fields: computedFieldAttempts,
      },
      { status: 403 }
    )
  }

  // Validate title if provided
  if (body.title !== undefined && body.title.trim() === '') {
    return NextResponse.json(
      { error: 'Validation failed: title cannot be empty' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Fetch current deal to validate changes
  const { data: currentDeal, error: fetchError } = await supabase
    .from('deals')
    .select(`
      id,
      tenant_id,
      pipeline_id,
      stage_id,
      status,
      stage:pipeline_stages(id, name)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !currentDeal) {
    return NextResponse.json(
      { error: 'Deal not found' },
      { status: 404 }
    )
  }

  // Handle stage change
  if (body.stage_id && body.stage_id !== currentDeal.stage_id) {
    // Verify new stage exists and belongs to tenant
    const { data: newStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, pipeline_id, is_won, is_lost')
      .eq('id', body.stage_id)
      .eq('tenant_id', tenantId)
      .single()

    if (stageError || !newStage) {
      return NextResponse.json(
        { error: 'Invalid stage_id: stage not found' },
        { status: 400 }
      )
    }

    // Determine which pipeline to validate against
    const targetPipelineId = body.pipeline_id || currentDeal.pipeline_id

    // Ensure stage belongs to the target pipeline
    if (newStage.pipeline_id !== targetPipelineId) {
      return NextResponse.json(
        { error: 'Invalid stage_id: stage does not belong to the deal pipeline' },
        { status: 400 }
      )
    }

    // Auto-update status based on stage flags
    if (newStage.is_won && body.status !== 'won') {
      body.status = 'won'
      body.closed_at = new Date().toISOString()
    } else if (newStage.is_lost && body.status !== 'lost') {
      body.status = 'lost'
      body.closed_at = new Date().toISOString()
    }
  }

  // Handle pipeline change
  if (body.pipeline_id && body.pipeline_id !== currentDeal.pipeline_id) {
    // Verify new pipeline exists and belongs to tenant
    const { data: newPipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', body.pipeline_id)
      .eq('tenant_id', tenantId)
      .single()

    if (pipelineError || !newPipeline) {
      return NextResponse.json(
        { error: 'Invalid pipeline_id: pipeline not found' },
        { status: 400 }
      )
    }

    // If pipeline changes but stage doesn't, we need to assign a new stage
    if (!body.stage_id || body.stage_id === currentDeal.stage_id) {
      // Get first stage of new pipeline
      const { data: firstStage, error: firstStageError } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('pipeline_id', body.pipeline_id)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      if (firstStageError || !firstStage) {
        return NextResponse.json(
          { error: 'No stages found for new pipeline' },
          { status: 400 }
        )
      }

      body.stage_id = firstStage.id
    }
  }

  // Verify contact if changed
  if (body.contact_id !== undefined && body.contact_id !== null) {
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', body.contact_id)
      .eq('tenant_id', tenantId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Invalid contact_id: contact not found' },
        { status: 400 }
      )
    }
  }

  // Build update object
  const updateData: DealUpdate = {
    ...(body.title && { title: body.title.trim() }),
    ...(body.pipeline_id !== undefined && { pipeline_id: body.pipeline_id }),
    ...(body.stage_id !== undefined && { stage_id: body.stage_id }),
    ...(body.contact_id !== undefined && { contact_id: body.contact_id }),
    ...(body.value !== undefined && { value: body.value }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.assigned_to !== undefined && { assigned_to: body.assigned_to }),
    ...(body.expected_close_date !== undefined && { expected_close_date: body.expected_close_date }),
    ...(body.closed_at !== undefined && { closed_at: body.closed_at }),
    ...(body.custom_fields !== undefined && { custom_fields: body.custom_fields }),
  }

  const { data, error } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select(`
      *,
      contact:contacts(id, name, email, phone, type, status),
      pipeline:pipelines(id, name, is_default, is_active),
      stage:pipeline_stages(id, name, color, position, is_won, is_lost),
      assigned_user:users(id, name, email)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update deal', details: error.message },
      { status: 500 }
    )
  }

  // Emit automation events
  const eventPromises: Promise<any>[] = []

  // Stage change event
  if (body.stage_id && body.stage_id !== currentDeal.stage_id) {
    eventPromises.push(
      emitStageChange({
        tenantId,
        dealId: id,
        fromStageId: currentDeal.stage_id,
        toStageId: body.stage_id,
        fromStageName: (currentDeal.stage as any)?.name,
        toStageName: (data.stage as any)?.name,
      })
    )
  }

  // Status change event
  if (body.status && body.status !== currentDeal.status) {
    eventPromises.push(
      emitStatusChange({
        tenantId,
        dealId: id,
        fromStatus: currentDeal.status,
        toStatus: body.status,
      })
    )
  }

  // General update event (if not stage or status change)
  if (eventPromises.length === 0) {
    eventPromises.push(
      emitEvent({
        tenantId,
        entityType: 'deal',
        entityId: id,
        eventType: 'updated',
        payload: {
          updated_fields: Object.keys(updateData),
        },
      })
    )
  }

  // Fire and forget - don't block response
  Promise.all(eventPromises).catch((err) => {
    console.error('[DealUpdate] Failed to emit events:', err)
  })

  return NextResponse.json({ data }, { status: 200 })
}
