import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'
import { PeoplePageClient } from './PeoplePageClient'
import { getChurchMembers, getCustomFields, getCustomFieldValues } from '@/app/actions/people'

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

  // Fetch church members, custom fields, and custom field values
  const [
    { members },
    { fields: customFields },
    { values: customFieldValues },
  ] = await Promise.all([
    getChurchMembers(profile.church_id),
    getCustomFields(profile.church_id),
    getCustomFieldValues(profile.church_id),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} profile={profile || undefined} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar className="w-64 flex-shrink-0" />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PeoplePageClient
              members={members}
              customFields={customFields}
              customFieldValues={customFieldValues}
              churchId={profile.church_id}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
