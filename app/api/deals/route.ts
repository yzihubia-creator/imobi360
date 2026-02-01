import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { emitEvent } from '@/lib/events/emitter'
import type { Database } from '@/src/types/supabase'

type DealInsert = Database['public']['Tables']['deals']['Insert']
type DealRow = Database['public']['Tables']['deals']['Row']

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing tenant context' },
      { status: 401 }
    )
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  // Build query with optional filters
  let query = supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, name, email, phone, type),
      pipeline:pipelines(id, name, is_default),
      stage:pipeline_stages(id, name, color, position, is_won, is_lost)
    `)
    .eq('tenant_id', tenantId)

  // Apply filters
  const pipelineId = searchParams.get('pipeline_id')
  const stageId = searchParams.get('stage_id')
  const contactId = searchParams.get('contact_id')

  if (pipelineId) {
    query = query.eq('pipeline_id', pipelineId)
  }
  if (stageId) {
    query = query.eq('stage_id', stageId)
  }
  if (contactId) {
    query = query.eq('contact_id', contactId)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing tenant context' },
      { status: 401 }
    )
  }

  let body: Partial<DealInsert>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate required fields
  if (!body.title || body.title.trim() === '') {
    return NextResponse.json(
      { error: 'Validation failed: title is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Determine pipeline_id (use provided or default)
  let pipelineId = body.pipeline_id

  if (!pipelineId) {
    // Fetch default pipeline
    const { data: defaultPipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    if (pipelineError || !defaultPipeline) {
      return NextResponse.json(
        { error: 'No default pipeline found. Please specify pipeline_id' },
        { status: 400 }
      )
    }

    pipelineId = defaultPipeline.id
  }

  // Determine stage_id (use provided or first stage of pipeline)
  let stageId = body.stage_id

  if (!stageId) {
    // Fetch first stage of the pipeline
    const { data: firstStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('pipeline_id', pipelineId)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    if (stageError || !firstStage) {
      return NextResponse.json(
        { error: 'No stages found for pipeline. Please specify stage_id' },
        { status: 400 }
      )
    }

    stageId = firstStage.id
  } else {
    // Verify stage belongs to the pipeline and tenant
    const { data: stage, error: stageVerifyError } = await supabase
      .from('pipeline_stages')
      .select('id, pipeline_id')
      .eq('id', stageId)
      .eq('tenant_id', tenantId)
      .single()

    if (stageVerifyError || !stage) {
      return NextResponse.json(
        { error: 'Invalid stage_id: stage not found' },
        { status: 400 }
      )
    }

    if (stage.pipeline_id !== pipelineId) {
      return NextResponse.json(
        { error: 'Invalid stage_id: stage does not belong to specified pipeline' },
        { status: 400 }
      )
    }
  }

  // Verify contact belongs to tenant if provided
  if (body.contact_id) {
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

  // Create the deal
  const newDeal: DealInsert = {
    tenant_id: tenantId,
    pipeline_id: pipelineId,
    stage_id: stageId,
    title: body.title.trim(),
    contact_id: body.contact_id || null,
    value: body.value || null,
    status: body.status || 'open',
    assigned_to: body.assigned_to || null,
    expected_close_date: body.expected_close_date || null,
    custom_fields: body.custom_fields || null,
  }

  const { data, error } = await supabase
    .from('deals')
    .insert(newDeal)
    .select(`
      *,
      contact:contacts(id, name, email, phone, type),
      pipeline:pipelines(id, name, is_default),
      stage:pipeline_stages(id, name, color, position, is_won, is_lost)
    `)
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create deal', details: error.message },
      { status: 500 }
    )
  }

  // Emit event for automation hooks
  await emitEvent({
    tenantId,
    entityType: 'deal',
    entityId: data.id,
    eventType: 'created',
    payload: {
      title: data.title,
      value: data.value,
      status: data.status,
      pipeline_id: data.pipeline_id,
      stage_id: data.stage_id,
      contact_id: data.contact_id,
    },
  })

  return NextResponse.json({ data }, { status: 201 })
}
