import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { fetchAuditLog } from '@/lib/audit-log/server'

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

  // Verify deal exists and belongs to tenant
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (dealError || !deal) {
    return NextResponse.json(
      { error: 'Deal not found' },
      { status: 404 }
    )
  }

  // Fetch audit log
  const auditLog = await fetchAuditLog(tenantId, 'deal', id)

  return NextResponse.json({ data: auditLog }, { status: 200 })
}
