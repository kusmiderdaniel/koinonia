import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="mt-4 space-y-2">
            <p className="text-gray-600">
              Welcome, <span className="font-semibold">{profile?.full_name || user.email}</span>!
            </p>
            <p className="text-sm text-gray-500">Email: {user.email}</p>
            {profile?.church_id && (
              <p className="text-sm text-gray-500">Church ID: {profile.church_id}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
