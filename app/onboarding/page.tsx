'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <Button variant="outline-pill" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Koinonia</h1>
          <p className="text-muted-foreground">
            Let's get you set up. Are you starting a new church or joining an existing one?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>Create a New Church</CardTitle>
              <CardDescription>
                Set up your church organization and become the administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Full administrative access</li>
                <li>✓ Manage ministries and events</li>
                <li>✓ Invite volunteers and leaders</li>
                <li>✓ Get a unique join code for members</li>
              </ul>
              <Button asChild className="w-full !rounded-full !bg-brand hover:!bg-brand/90 text-white" size="lg">
                <Link href="/onboarding/create-church">
                  Create Church
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>Join Existing Church</CardTitle>
              <CardDescription>
                Connect with your church and start volunteering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Sign up for events and services</li>
                <li>✓ Manage your availability</li>
                <li>✓ Connect with your ministry teams</li>
                <li>✓ Receive notifications and updates</li>
              </ul>
              <Button asChild className="w-full !rounded-full !bg-brand hover:!bg-brand/90 text-white" size="lg">
                <Link href="/onboarding/join-church">
                  Join Church
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
