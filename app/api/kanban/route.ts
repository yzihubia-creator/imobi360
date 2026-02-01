import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/src/types/supabase'

type PipelineStageRow = Database['public']['Tables']['pipeline_stages']['Row']
type DealRow = Database['public']['Tables']['deals']['Row']

interface KanbanStage {
  id: string
  name: string
  color: string | null
  position: number
  is_won: boolean | null
  is_lost: boolean | null
  deals: Array<{
    id: string
    title: string
    value: number | null
    status: string
    contact_id: string | null
    assigned_to: string | null
    expected_close_date: string | null
    created_at: string | null
    contact: {
      id: string
      name: string
      email: string | null
      phone: string | null
      type: string
    } | null
  }>
}

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

  // Get pipeline_id from query or find default
  let pipelineId = searchParams.get('pipeline_id')

  if (!pipelineId) {
    // Fetch default pipeline for tenant
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
  } else {
    // Verify pipeline exists and belongs to tenant
    const { data: pipeline, error: verifyError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('tenant_id', tenantId)
      .single()

    if (verifyError || !pipeline) {
      return NextResponse.json(
        { error: 'Invalid pipeline_id: pipeline not found' },
        { status: 404 }
      )
    }
  }

  // Fetch pipeline stages with nested deals
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select(`
      id,
      name,
      color,
      position,
      is_won,
      is_lost,
      deals (
        id,
        title,
        value,
        status,
        contact_id,
        assigned_to,
        expected_close_date,
        created_at,
        contact:contacts (
          id,
          name,
          email,
          phone,
          type
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true })

  if (stagesError) {
    return NextResponse.json(
      { error: 'Failed to fetch kanban data', details: stagesError.message },
      { status: 500 }
    )
  }

  // Filter deals to only include those belonging to the tenant
  // and order them by created_at descending
  const kanbanData: KanbanStage[] = (stages || []).map((stage) => {
    const stageDeals = Array.isArray(stage.deals) ? stage.deals : []

    // Filter by tenant_id and sort by created_at
    const filteredDeals = stageDeals
      .filter((deal: any) => deal.tenant_id === tenantId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA // Descending order (newest first)
      })
      .map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value,
        status: deal.status,
        contact_id: deal.contact_id,
        assigned_to: deal.assigned_to,
        expected_close_date: deal.expected_close_date,
        created_at: deal.created_at,
        contact: deal.contact || null,
      }))

    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
      is_won: stage.is_won,
      is_lost: stage.is_lost,
      deals: filteredDeals,
    }
  })

  return NextResponse.json({ data: kanbanData }, { status: 200 })
}
