import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

export default async function PeoplePage() {
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
            <h1 className="text-3xl font-bold text-gray-900">People</h1>
            <p className="mt-2 text-gray-600">Manage church members and volunteers</p>

            <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                People management features will be available here soon.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
