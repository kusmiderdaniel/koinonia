import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

export default async function EventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.church_id) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} profile={profile || undefined} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar className="w-64 flex-shrink-0" />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-gray-600">Manage church events and volunteer scheduling</p>

            <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                Event management features will be available here soon.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
