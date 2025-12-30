import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params

  const supabase = createServiceRoleClient()

  const { data: church, error } = await supabase
    .from('churches')
    .select('name, subdomain')
    .eq('subdomain', subdomain)
    .single()

  if (error || !church) {
    return NextResponse.json(
      { error: 'Church not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(church)
}
