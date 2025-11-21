import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${origin}/auth/signin?error=${error.message}`)
    }
  }

  // Check if there's a next parameter to redirect to a specific page
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Default redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
