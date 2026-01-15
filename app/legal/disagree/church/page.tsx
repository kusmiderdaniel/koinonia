import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getDisagreementInfo, getPendingDisagreements } from '../actions'
import { ChurchDisagreementClient } from './ChurchDisagreementClient'

interface ChurchDisagreePageProps {
  searchParams: Promise<{
    doc?: string
    id?: string
    error?: string
  }>
}

/**
 * Church owner disagreement page for DPA / Admin Terms
 * Shows warning about church deletion if owner disagrees
 */
export default async function ChurchDisagreePage({ searchParams }: ChurchDisagreePageProps) {
  const params = await searchParams

  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/legal/disagree/church')
  }

  // If error was passed from the parent page, show it
  if (params.error) {
    return (
      <ChurchDisagreementClient
        mode="error"
        error={params.error}
      />
    )
  }

  // If no document specified, check for pending disagreements
  if (!params.doc || !params.id) {
    const { data: pending } = await getPendingDisagreements()

    // Filter to only church-level disagreements
    const churchPending = pending?.filter((d) => d.isChurchDeletion) || []

    if (churchPending.length > 0) {
      return (
        <ChurchDisagreementClient
          mode="pending"
          pendingDisagreements={churchPending}
        />
      )
    }

    // No document and no pending - show helpful message
    return (
      <ChurchDisagreementClient
        mode="error"
        error="No document specified. If you followed a link from an email, please try again or contact support."
      />
    )
  }

  // Get disagreement info for the specified document
  const documentType = params.doc as 'dpa' | 'church_admin_terms'

  // Validate it's a church document type (not ToS/Privacy Policy)
  if (params.doc === 'terms_of_service' || params.doc === 'privacy_policy') {
    redirect(`/legal/disagree/user?doc=${params.doc}&id=${params.id}`)
  }

  const { data, error } = await getDisagreementInfo(documentType, params.id)

  if (error) {
    return (
      <ChurchDisagreementClient
        mode="error"
        error={error}
      />
    )
  }

  if (!data) {
    return (
      <ChurchDisagreementClient
        mode="error"
        error="Document information not found. Please try again or contact support."
      />
    )
  }

  // Get list of admins who can become owners (for transfer option)
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('church_id')
    .eq('user_id', user.id)
    .single()

  let transferCandidates: Array<{ id: string; name: string; email: string }> = []

  if (profile?.church_id) {
    const { data: admins } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, user_id, users:user_id(email)')
      .eq('church_id', profile.church_id)
      .eq('role', 'admin')
      .neq('user_id', user.id)

    if (admins) {
      transferCandidates = admins.map((admin) => {
        const userData = admin.users as unknown as { email: string } | null
        return {
          id: admin.id,
          name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Unnamed Admin',
          email: userData?.email || '',
        }
      })
    }
  }

  return (
    <ChurchDisagreementClient
      mode="disagree"
      disagreementInfo={data}
      transferCandidates={transferCandidates}
    />
  )
}
