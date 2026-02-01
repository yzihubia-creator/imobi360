import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { emitEvent } from '@/lib/events/emitter'
import type { Database } from '@/src/types/supabase'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactRow = Database['public']['Tables']['contacts']['Row']

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing tenant context' },
      { status: 401 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('type', 'lead')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: error.message },
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

  let body: Partial<ContactInsert>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (!body.name || body.name.trim() === '') {
    return NextResponse.json(
      { error: 'Validation failed: name is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const newLead: ContactInsert = {
    name: body.name.trim(),
    tenant_id: tenantId,
    type: 'lead',
    email: body.email || null,
    phone: body.phone || null,
    source: body.source || null,
    status: body.status || 'active',
    assigned_to: body.assigned_to || null,
    custom_fields: body.custom_fields || null,
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(newLead)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create lead', details: error.message },
      { status: 500 }
    )
  }

  // Emit event for automation hooks
  await emitEvent({
    tenantId,
    entityType: 'contact',
    entityId: data.id,
    eventType: 'created',
    payload: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      source: data.source,
    },
  })

  return NextResponse.json({ data }, { status: 201 })
}
