import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenantId, businessName, businessType, slug, userRole } = body

    if (!tenantId || !businessName || !slug || !userRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        name: businessName,
        slug,
        business_type: businessType,
        status: 'active',
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (tenantError) {
      console.error('Tenant update error:', tenantError)
      return NextResponse.json(
        { error: 'Failed to update tenant' },
        { status: 500 }
      )
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ role: userRole })
      .eq('auth_user_id', user.id)
      .eq('tenant_id', tenantId)

    if (userError) {
      console.error('User update error:', userError)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
