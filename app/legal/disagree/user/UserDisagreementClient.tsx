'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Calendar, Clock, ArrowLeft, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { recordDisagreement, withdrawDisagreement, type DisagreementInfo } from '../actions'

interface UserDisagreementClientProps {
  mode: 'disagree' | 'pending' | 'error'
  disagreementInfo?: DisagreementInfo
  pendingDisagreements?: Array<{
    id: string
    documentType: string
    documentTitle: string
    deadline: string
    isChurchDeletion: boolean
  }>
  error?: string
}

const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
}

export function UserDisagreementClient({
  mode,
  disagreementInfo,
  pendingDisagreements,
  error,
}: UserDisagreementClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'warning' | 'confirm'>('warning')

  const handleConfirmDisagreement = async () => {
    if (!disagreementInfo || !understood || !password) return

    setIsSubmitting(true)
    try {
      const result = await recordDisagreement(disagreementInfo.id, password)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success('Disagreement recorded')
      router.push('/legal/disagree/success?type=user')
    } catch {
      toast.error('An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (disagreementId: string) => {
    setIsSubmitting(true)
    try {
      const result = await withdrawDisagreement(disagreementId)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success('Disagreement withdrawn - you have re-agreed to the document')
      router.push('/dashboard')
    } catch {
      toast.error('An error occurred')
      setIsSubmitting(false)
    }
  }

  // Error state
  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending disagreements list
  if (mode === 'pending' && pendingDisagreements) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Disagreements
            </CardTitle>
            <CardDescription>
              You have disagreed with the following documents. Your account will be deleted if you
              don&apos;t withdraw your disagreement before the deadline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDisagreements.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{d.documentTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    Deadline: {format(new Date(d.deadline), 'PPP')}
                  </p>
                  <p className="text-sm text-red-600">
                    {formatDistanceToNow(new Date(d.deadline), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw(d.id)}
                  disabled={isSubmitting}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Re-agree
                </Button>
              </div>
            ))}

            <div className="pt-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Disagreement flow
  if (mode === 'disagree' && disagreementInfo) {
    const deadline = new Date(disagreementInfo.deadline)
    const effectiveDate = new Date(disagreementInfo.effectiveDate)

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-xl w-full">
          {step === 'warning' ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                  Account Deletion Warning
                </CardTitle>
                <CardDescription>
                  Please read this carefully before proceeding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  <AlertTitle>Your account will be permanently deleted</AlertTitle>
                  <AlertDescription>
                    If you disagree with the updated{' '}
                    <strong>{DOCUMENT_TYPE_NAMES[disagreementInfo.documentType]}</strong> and do not
                    re-agree before the deadline, your Koinonia account and all associated data will
                    be permanently deleted.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Effective Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(effectiveDate, 'PPPP')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-900">
                    <Clock className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Deletion Deadline</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {format(deadline, 'PPPP')}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {formatDistanceToNow(deadline, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>By disagreeing, you acknowledge that:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You cannot use Koinonia without accepting the current terms</li>
                    <li>Your account will be deleted on the deadline date if you don&apos;t re-agree</li>
                    <li>You can withdraw your disagreement at any time before the deadline</li>
                    <li>Once deleted, your account cannot be recovered</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStep('confirm')}
                    className="flex-1"
                  >
                    I Understand, Continue
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  Confirm Your Disagreement
                </CardTitle>
                <CardDescription>
                  Enter your password to confirm your disagreement with the{' '}
                  {DOCUMENT_TYPE_NAMES[disagreementInfo.documentType]}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="understood"
                      checked={understood}
                      onCheckedChange={(checked) => setUnderstood(checked === true)}
                    />
                    <label htmlFor="understood" className="text-sm">
                      I understand that my account will be permanently deleted on{' '}
                      <strong className="text-red-600">{format(deadline, 'PPP')}</strong> if I do not
                      withdraw this disagreement.
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('warning')} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDisagreement}
                    disabled={!understood || !password || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Disagreement'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    )
  }

  return null
}
