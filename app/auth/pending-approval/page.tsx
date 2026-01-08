import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, LogOut, XCircle, Check, Mail, Bell, LayoutDashboard } from 'lucide-react'

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

  const isPending = status === 'pending'
  const isRejected = status === 'rejected'

  return (
    <div className={`min-h-[100dvh] ${isPending ? 'bg-gradient-to-b from-amber-500/5 via-background to-background' : 'bg-gradient-to-b from-red-500/5 via-background to-background'}`}>
      {/* Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <form action="/api/auth/signout" method="POST">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2"
            type="submit"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-16 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2 ${isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {isPending ? (
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {isPending ? 'Awaiting Approval' : 'Registration Rejected'}
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">
              {isPending
                ? 'Your registration is pending approval from a church administrator'
                : 'Unfortunately, your registration was not approved'}
            </p>
            {isPending && createdAt && (
              <p className="text-sm text-muted-foreground">
                Submitted on {createdAt}
              </p>
            )}
          </div>

          {/* Info Card */}
          <Card className="border-2">
            <CardContent className="p-6 sm:p-8">
              {isPending ? (
                <div className="space-y-6">
                  {/* What happens next */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-center">What happens next?</h3>
                    <ul className="space-y-3">
                      {[
                        { icon: Check, text: 'A church administrator will review your registration' },
                        { icon: Mail, text: "You'll receive an email once approved" },
                        { icon: LayoutDashboard, text: 'After approval, you can access the church dashboard' },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                            <item.icon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-muted-foreground">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Notification hint */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Check your email for approval notifications
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rejection message */}
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      Please contact the church administrator for more information about your registration.
                    </p>
                  </div>

                  {/* Contact hint */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <Mail className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Reach out to your church for assistance
                    </p>
                  </div>
                </div>
              )}

              {/* User info */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-center text-muted-foreground">
                  Signed in as <span className="font-medium">{user.email}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sign out button */}
          <form action="/api/auth/signout" method="POST">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base !rounded-full !border-2 !border-black dark:!border-white gap-2"
              type="submit"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@koinonia.app" className="text-brand hover:underline">
              support@koinonia.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
