import Link from 'next/link'
import { Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SuccessPageProps {
  searchParams: Promise<{
    type?: 'user' | 'church'
  }>
}

export default async function DisagreementSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const type = params.type || 'user'

  const isChurch = type === 'church'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle>Disagreement Recorded</CardTitle>
          <CardDescription>
            Your disagreement has been recorded successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isChurch ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Your disagreement with the legal document update has been recorded. As a result:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your church is scheduled for deletion</li>
                <li>Church members will be notified 10 days before deletion</li>
                <li>You can transfer church ownership to another admin before the deadline</li>
                <li>You can export your church data before deletion</li>
                <li>You can withdraw your disagreement at any time before the deadline</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Your disagreement with the legal document update has been recorded. As a result:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your account is scheduled for deletion on the deadline date</li>
                <li>You can continue using Koinonia until then</li>
                <li>You can withdraw your disagreement at any time before the deadline</li>
                <li>If you withdraw, you accept the updated terms and your account will not be deleted</li>
              </ul>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Change your mind?
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You can withdraw your disagreement from your profile settings at any time before
                  the deadline.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link href="/legal/disagree/user">
                View My Disagreements
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
