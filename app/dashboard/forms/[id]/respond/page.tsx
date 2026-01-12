import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getRelationProperty } from '@/lib/utils/relations'
import { InternalFormClient } from './InternalFormClient'
import { type Locale } from '@/lib/i18n/config'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'

interface RespondPageProps {
  params: Promise<{ id: string }>
}

export default async function RespondPage({ params }: RespondPageProps) {
  const { id } = await params

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
    .select('id, church_id, first_name, last_name, email, language, churches(first_day_of_week)')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch form - must be published and belong to the user's church
  const { data: form } = await adminClient
    .from('forms')
    .select('id, title, title_i18n, description, description_i18n, status, access_type, public_token, allow_multiple_submissions, is_multilingual')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (!form) {
    notFound()
  }

  // Check if form is accessible
  if (form.status !== 'published') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Form Unavailable</h1>
          <p className="text-muted-foreground">
            This form is not currently accepting responses.
          </p>
        </div>
      </div>
    )
  }

  // Redirect public forms to their public URL so logged-in users can fill them anonymously
  if (form.access_type === 'public') {
    if (form.public_token) {
      redirect(`/forms/${form.public_token}`)
    } else {
      // Public form without token - shouldn't happen, redirect to forms list
      redirect('/dashboard/forms')
    }
  }

  const isAnonymous = form.access_type === 'internal_anonymous'

  // Get fields (include i18n columns for multilingual forms)
  const { data: fields } = await adminClient
    .from('form_fields')
    .select('id, type, label, label_i18n, description, description_i18n, placeholder, placeholder_i18n, required, options, options_i18n, settings, sort_order')
    .eq('form_id', form.id)
    .order('sort_order')

  // Get conditions
  const { data: conditions } = await adminClient
    .from('form_conditions')
    .select('id, target_field_id, source_field_id, operator, value, action')
    .eq('form_id', form.id)

  // Check if user has already submitted (only for non-anonymous forms that don't allow multiple submissions)
  let existingSubmission = null
  const allowMultiple = form.allow_multiple_submissions ?? false
  if (!isAnonymous && !allowMultiple) {
    const { data } = await adminClient
      .from('form_submissions')
      .select('id')
      .eq('form_id', form.id)
      .eq('respondent_id', profile.id)
      .single()
    existingSubmission = data
  }

  // Get first day of week from church preferences
  const firstDayOfWeek = getRelationProperty(profile.churches, 'first_day_of_week', 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Get user's language preference (profile setting > app locale)
  const appLocale = await getLocale() as Locale
  const userLocale = (profile.language as Locale) || appLocale

  return (
    <InternalFormClient
      formId={form.id}
      form={{
        title: form.title,
        title_i18n: form.title_i18n,
        description: form.description,
        description_i18n: form.description_i18n,
        is_multilingual: form.is_multilingual,
      }}
      fields={fields || []}
      conditions={conditions || []}
      respondent={{
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: profile.email,
      }}
      hasExistingSubmission={!!existingSubmission}
      isAnonymous={isAnonymous}
      weekStartsOn={firstDayOfWeek}
      userLocale={userLocale}
    />
  )
}
