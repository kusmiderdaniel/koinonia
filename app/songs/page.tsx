import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

export default async function SongsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">Songs</h1>
            <p className="mt-2 text-gray-600">Manage worship songs and setlists</p>

            <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Coming Soon</h3>
              <p className="mt-1 text-sm text-gray-500">
                Song management features will be available here soon.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
