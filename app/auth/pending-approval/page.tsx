import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, LogOut } from 'lucide-react'

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user already has an approved profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profile) {
    // User has an approved profile, redirect to dashboard
    redirect('/dashboard')
  }

  // Check pending registration status
  const { data: pendingReg } = await supabase
    .from('pending_registrations')
    .select('status, created_at')
    .eq('user_id', user.id)
    .single()

  const status = pendingReg?.status || 'pending'
  const createdAt = pendingReg?.created_at
    ? new Date(pendingReg.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">
            {status === 'pending' && 'Awaiting Approval'}
            {status === 'rejected' && 'Registration Rejected'}
          </CardTitle>
          <CardDescription>
            {status === 'pending' && (
              <>
                Your registration is pending approval from a church administrator.
                {createdAt && (
                  <span className="block mt-1 text-xs">
                    Submitted on {createdAt}
                  </span>
                )}
              </>
            )}
            {status === 'rejected' && (
              'Unfortunately, your registration was not approved. Please contact the church administrator for more information.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'pending' && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>A church administrator will review your registration</li>
                <li>You&apos;ll receive an email once approved</li>
                <li>After approval, you can access the church dashboard</li>
              </ul>
            </div>
          )}

          <form action="/api/auth/signout" method="POST">
            <Button variant="outline" className="w-full gap-2" type="submit">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Signed in as {user.email}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
