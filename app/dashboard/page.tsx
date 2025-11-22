import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { ChurchSetup } from './ChurchSetup'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('id', user.id)
    .single()

  console.log('Dashboard - Profile data:', profile)
  console.log('Dashboard - Profile error:', profileError)
  console.log('Dashboard - User ID:', user.id)
  console.log('Dashboard - Church ID:', profile?.church_id)
  console.log('Dashboard - Church data:', profile?.church)

  // If user doesn't have a church, show church setup
  if (!profile?.church_id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} profile={profile || undefined} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ChurchSetup />
        </div>
      </div>
    )
  }

  // User has a church - show normal dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} profile={profile || undefined} />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar className="w-64 flex-shrink-0" />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="mt-2 text-gray-600">
            {profile?.church?.name || 'Your Church'} • {profile?.role || 'Member'}
          </p>
        </div>

        {/* Church Info Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">{profile?.church?.name}</h2>
                <p className="text-sm text-gray-500">Your church</p>
              </div>
            </div>
            {profile?.church?.email && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">{profile.church.email}</p>
                {profile?.church?.phone && (
                  <p className="text-sm text-gray-600">{profile.church.phone}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats - Placeholder for future features */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">0</h2>
                <p className="text-sm text-gray-500">Upcoming events</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">0</h2>
                <p className="text-sm text-gray-500">Active volunteers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Dashboard features coming soon</h3>
          <p className="mt-1 text-sm text-gray-500">
            Events, volunteer management, and more will be available here.
          </p>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
