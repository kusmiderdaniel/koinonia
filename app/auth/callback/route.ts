import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminClient = createServiceRoleClient()

        // Check if user already has an approved profile
        const { data: existingProfile } = await adminClient
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (existingProfile) {
          // User already has a profile, redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Check if user has a pending registration
        const { data: existingPending } = await adminClient
          .from('pending_registrations')
          .select('id, status')
          .eq('user_id', user.id)
          .single()

        if (existingPending) {
          // User already has a pending registration, redirect to pending approval
          return NextResponse.redirect(new URL('/auth/pending-approval', request.url))
        }

        // New user - redirect to onboarding to create or join a church
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/auth-error', request.url))
}
