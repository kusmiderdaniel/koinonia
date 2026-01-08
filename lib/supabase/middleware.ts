import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user and trying to access protected routes, redirect to signin
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/invitation') &&
    !request.nextUrl.pathname.startsWith('/forms') &&
    !request.nextUrl.pathname.startsWith('/links') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check if they have an approved profile
  if (
    user &&
    !request.nextUrl.pathname.startsWith('/onboarding') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/invitation') &&
    !request.nextUrl.pathname.startsWith('/forms') &&
    !request.nextUrl.pathname.startsWith('/links') &&
    request.nextUrl.pathname !== '/'
  ) {
    // Check for approved profile (using user_id)
    // Use limit(1) instead of single() in case user has multiple profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const profile = profiles?.[0] || null

    if (!profile) {
      // Check if user has a pending registration
      const { data: pendingReg } = await supabase
        .from('pending_registrations')
        .select('id, status')
        .eq('user_id', user.id)
        .single()

      if (pendingReg) {
        // User has a pending registration, redirect to pending-approval page
        const url = request.nextUrl.clone()
        url.pathname = '/auth/pending-approval'
        return NextResponse.redirect(url)
      }

      // No profile and no pending registration - redirect to onboarding
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
