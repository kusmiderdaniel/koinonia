import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ reason?: string }>
}

const reasonMessages: Record<string, string> = {
  invalid_token: 'The invitation link is invalid or malformed.',
  invalid_action: 'The action specified is not valid.',
  token_not_found: 'This invitation link is no longer valid or has already been used.',
  no_assignment: 'The assignment associated with this invitation could not be found.',
  update_failed: 'We encountered an error processing your response. Please try again.',
  default: 'Something went wrong processing your invitation.',
}

export default async function InvitationErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams
  const message = reasonMessages[reason || 'default'] || reasonMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Something went wrong</h1>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">{message}</p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign in to manage invitations</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              If you continue to have issues, please contact your church administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
