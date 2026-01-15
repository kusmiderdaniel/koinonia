import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDisagreementInfo, getPendingDisagreements } from '../actions'
import { UserDisagreementClient } from './UserDisagreementClient'

interface UserDisagreePageProps {
  searchParams: Promise<{
    doc?: string
    id?: string
    error?: string
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

  // Get user's language preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('language')
    .eq('user_id', user.id)
    .single()

  const language = (profile?.language === 'pl' ? 'pl' : 'en') as 'en' | 'pl'

  // If error was passed from the parent page, show it
  if (params.error) {
    return (
      <UserDisagreementClient
        mode="error"
        error={params.error}
        language={language}
      />
    )
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
          language={language}
        />
      )
    }

    // No document and no pending - show helpful message instead of dashboard
    return (
      <UserDisagreementClient
        mode="error"
        error={language === 'pl'
          ? "Nie określono dokumentu. Jeśli kliknąłeś link z e-maila, spróbuj ponownie lub skontaktuj się z pomocą techniczną."
          : "No document specified. If you followed a link from an email, please try again or contact support."}
        language={language}
      />
    )
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
        language={language}
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
      language={language}
    />
  )
}
