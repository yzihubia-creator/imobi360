/**
 * Tenant Configuration API
 *
 * GET /api/tenant/config?tenant_id={id}
 * Returns merged tenant configuration (template + overrides)
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadTenantConfig } from '@/lib/tenant-config'

export async function GET(request: NextRequest) {
  try {
    // Get tenant_id from query params
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant_id parameter' }, { status: 400 })
    }

    // Load tenant configuration
    const config = await loadTenantConfig(tenantId)

    return NextResponse.json(config, { status: 200 })
  } catch (error) {
    console.error('[API /tenant/config] Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to load tenant configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
