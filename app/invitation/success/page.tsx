import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ action?: string; event?: string; position?: string }>
}

export default async function InvitationSuccessPage({ searchParams }: Props) {
  const { action, event, position } = await searchParams
  const accepted = action === 'accepted'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          {accepted ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          )}
          <h1 className="text-2xl font-bold mt-4">
            {accepted ? "You're all set!" : 'Response recorded'}
          </h1>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            {accepted
              ? `You've accepted the invitation to serve as ${position || 'this role'} for ${event || 'this event'}.`
              : `You've declined the invitation to serve as ${position || 'this role'} for ${event || 'this event'}.`}
          </p>
          {accepted && (
            <p className="text-sm text-muted-foreground">
              We&apos;ll send you a reminder before the event.
            </p>
          )}
          <Button asChild className="w-full">
            <Link href="/auth/signin">Sign in to view your schedule</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
