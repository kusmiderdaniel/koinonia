'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Calendar,
  Clock,
  ArrowLeft,
  Trash2,
  Check,
  Users,
  Download,
  UserCog,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { recordDisagreement, withdrawDisagreement, type DisagreementInfo } from '../actions'
import { transferOwnership, exportChurchData } from './actions'

interface ChurchDisagreementClientProps {
  mode: 'disagree' | 'pending' | 'error'
  disagreementInfo?: DisagreementInfo
  pendingDisagreements?: Array<{
    id: string
    documentType: string
    documentTitle: string
    deadline: string
    isChurchDeletion: boolean
  }>
  transferCandidates?: Array<{
    id: string
    name: string
    email: string
  }>
  error?: string
}

const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  dpa: 'Data Processing Agreement',
  church_admin_terms: 'Church Administrator Terms',
}

export function ChurchDisagreementClient({
  mode,
  disagreementInfo,
  pendingDisagreements,
  transferCandidates = [],
  error,
}: ChurchDisagreementClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'warning' | 'options' | 'confirm'>('warning')
  const [selectedAction, setSelectedAction] = useState<'disagree' | 'transfer' | null>(null)
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('')
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferPassword, setTransferPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)

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
      router.push('/legal/disagree/success?type=church')
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

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || !transferPassword) return

    setIsSubmitting(true)
    try {
      const result = await transferOwnership(selectedNewOwner, transferPassword)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success('Ownership transferred successfully. Church deletion cancelled.')
      setShowTransferDialog(false)
      router.push('/dashboard')
    } catch {
      toast.error('An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const result = await exportChurchData()

      if (result.error) {
        toast.error(result.error)
        setIsExporting(false)
        return
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `church-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Church data exported successfully')
    } catch {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
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
              Pending Church Deletions
            </CardTitle>
            <CardDescription>
              You have disagreed with the following documents. Your church will be deleted if you
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

            <div className="pt-4 flex gap-3">
              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
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
                  Church Deletion Warning
                </CardTitle>
                <CardDescription>
                  Please read this carefully before proceeding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant="destructive">
                  <Building2 className="h-4 w-4" />
                  <AlertTitle>Your church will be permanently deleted</AlertTitle>
                  <AlertDescription>
                    If you disagree with the updated{' '}
                    <strong>{DOCUMENT_TYPE_NAMES[disagreementInfo.documentType]}</strong> and do not
                    re-agree before the deadline, {disagreementInfo.churchName || 'your church'} and
                    all associated data will be permanently deleted.
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
                    <li>Your church cannot operate without accepting the current terms</li>
                    <li>
                      <strong>{disagreementInfo.churchName || 'Your church'}</strong> will be
                      deleted on the deadline date if you don&apos;t re-agree
                    </li>
                    <li>All church members will be disconnected from the church</li>
                    <li>Church members will be notified 10 days before deletion</li>
                    <li>You can withdraw your disagreement at any time before the deadline</li>
                    <li>Once deleted, your church data cannot be recovered</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStep('options')}
                    className="flex-1"
                  >
                    I Understand, Continue
                  </Button>
                </div>
              </CardContent>
            </>
          ) : step === 'options' ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  Your Options
                </CardTitle>
                <CardDescription>
                  Before deleting your church, consider these alternatives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transfer Ownership Option */}
                {transferCandidates.length > 0 && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <UserCog className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Transfer Ownership</p>
                        <p className="text-sm text-muted-foreground">
                          Transfer the church to another admin who accepts the new terms
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowTransferDialog(true)}
                      className="w-full"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Transfer to Another Admin
                    </Button>
                  </div>
                )}

                {/* Export Data Option */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Export Church Data</p>
                      <p className="text-sm text-muted-foreground">
                        Download all your church data before deletion
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export Church Data'}
                  </Button>
                </div>

                {/* Proceed with Disagreement */}
                <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg space-y-3 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        Proceed with Disagreement
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Schedule your church for deletion
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedAction('disagree')
                      setStep('confirm')
                    }}
                    className="w-full"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Proceed with Disagreement
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setStep('warning')} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
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
                      I understand that <strong>{disagreementInfo.churchName || 'my church'}</strong>{' '}
                      will be permanently deleted on{' '}
                      <strong className="text-red-600">{format(deadline, 'PPP')}</strong> if I do not
                      withdraw this disagreement.
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('options')} className="flex-1">
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

        {/* Transfer Ownership Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Church Ownership</DialogTitle>
              <DialogDescription>
                Select an admin to transfer ownership to. This will cancel the scheduled deletion.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newOwner">Select New Owner</Label>
                <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferCandidates.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferPassword">Your Password</Label>
                <Input
                  id="transferPassword"
                  type="password"
                  value={transferPassword}
                  onChange={(e) => setTransferPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwner || !transferPassword || isSubmitting}
              >
                {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
