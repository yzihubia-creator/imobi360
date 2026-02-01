import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { emitEvent } from '@/lib/events/emitter'
import { validateUpdatePermissions } from '@/lib/permissions'
import { resolveFormulaFields, isFormulaField } from '@/lib/formula-engine'
import { resolveRelationFields, isRelationField } from '@/lib/relation-engine'
import type { Database } from '@/src/types/supabase'
import type { UserRole } from '@/lib/permissions'

type ContactUpdate = Database['public']['Tables']['contacts']['Update']

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
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('type', 'lead')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch lead', details: error.message },
      { status: 500 }
    )
  }

  // Resolve formula fields
  const formulaValues = await resolveFormulaFields(tenantId, 'contact', data)

  // Resolve relation fields
  const relationValues = await resolveRelationFields(tenantId, 'contact', data)

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

  let body: Partial<ContactUpdate>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (body.name !== undefined && body.name.trim() === '') {
    return NextResponse.json(
      { error: 'Validation failed: name cannot be empty' },
      { status: 400 }
    )
  }

  if (body.tenant_id && body.tenant_id !== tenantId) {
    return NextResponse.json(
      { error: 'Cannot change tenant_id' },
      { status: 403 }
    )
  }

  if (body.type && body.type !== 'lead') {
    return NextResponse.json(
      { error: 'Cannot change lead type' },
      { status: 403 }
    )
  }

  // Validate field-level permissions
  const permissionCheck = validateUpdatePermissions(
    { userRole, entityType: 'contact' },
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
    const isFormula = await isFormulaField(tenantId, 'contact', fieldName)
    const isRelation = await isRelationField(tenantId, 'contact', fieldName)

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

  const supabase = await createClient()

  const updateData: ContactUpdate = {
    ...(body.name && { name: body.name.trim() }),
    ...(body.email !== undefined && { email: body.email }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.source !== undefined && { source: body.source }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.assigned_to !== undefined && { assigned_to: body.assigned_to }),
    ...(body.custom_fields !== undefined && { custom_fields: body.custom_fields }),
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('type', 'lead')
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update lead', details: error.message },
      { status: 500 }
    )
  }

  // Emit event for automation hooks
  emitEvent({
    tenantId,
    entityType: 'contact',
    entityId: id,
    eventType: 'updated',
    payload: {
      updated_fields: Object.keys(updateData),
    },
  }).catch((err) => {
    console.error('[LeadUpdate] Failed to emit event:', err)
  })

  return NextResponse.json({ data }, { status: 200 })
}
