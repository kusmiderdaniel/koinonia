import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDisagreementInfo, getPendingDisagreements } from '../actions'
import { UserDisagreementClient } from './UserDisagreementClient'

interface UserDisagreePageProps {
  searchParams: Promise<{
    doc?: string
    id?: string
  }>
}

/**
 * User disagreement page for Terms of Service / Privacy Policy
 * Shows warning about account deletion if user disagrees
 */
export default async function UserDisagreePage({ searchParams }: UserDisagreePageProps) {
  const params = await searchParams

  // Check if user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/legal/disagree/user')
  }

  // If no document specified, check for pending disagreements
  if (!params.doc || !params.id) {
    const { data: pending } = await getPendingDisagreements()

    if (pending && pending.length > 0) {
      // Show existing disagreements
      return (
        <UserDisagreementClient
          mode="pending"
          pendingDisagreements={pending}
        />
      )
    }

    // No document and no pending - redirect to dashboard
    redirect('/dashboard')
  }

  // Get disagreement info for the specified document
  const documentType = params.doc as 'terms_of_service' | 'privacy_policy'

  // Validate it's a user document type (not DPA/Admin Terms)
  if (params.doc === 'dpa' || params.doc === 'church_admin_terms') {
    redirect(`/legal/disagree/church?doc=${params.doc}&id=${params.id}`)
  }

  const { data, error } = await getDisagreementInfo(documentType, params.id)

  if (error) {
    return (
      <UserDisagreementClient
        mode="error"
        error={error}
      />
    )
  }

  if (!data) {
    redirect('/dashboard')
  }

  return (
    <UserDisagreementClient
      mode="disagree"
      disagreementInfo={data}
    />
  )
}
