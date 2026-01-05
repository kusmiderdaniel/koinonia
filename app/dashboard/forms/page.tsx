import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { FormsPageClient } from './FormsPageClient'
import { hasPageAccess } from '@/lib/permissions'
import type { FormWithRelations } from './types'

export default async function FormsPage() {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile with church context
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check page access - only leaders+ can access forms page
  if (!hasPageAccess(profile.role, 'forms')) {
    redirect('/dashboard')
  }

  // Fetch forms server-side
  const { data: forms } = await adminClient
    .from('forms')
    .select(
      `
      *,
      creator:profiles!created_by (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false })

  // Get submission counts for each form
  const formIds = forms?.map((f) => f.id) || []
  const { data: counts } = await adminClient
    .from('form_submissions')
    .select('form_id')
    .in('form_id', formIds)

  const countMap = (counts || []).reduce(
    (acc, s) => {
      acc[s.form_id] = (acc[s.form_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const formsWithCounts =
    forms?.map((form) => ({
      ...form,
      submissions_count: countMap[form.id] || 0,
    })) || []

  return (
    <FormsPageClient
      initialData={{
        forms: formsWithCounts as FormWithRelations[],
        role: profile.role,
      }}
    />
  )
}
