'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { leaveChurch, deleteAccount } from '../actions'
import { getConsentHistory } from '@/lib/legal/actions'
import { ActiveConsentsCard, ConsentHistoryCard, type ConsentRecord } from './privacy'

interface AccountSettingsCardProps {
  churchName: string
}

export function AccountSettingsCard({ churchName }: AccountSettingsCardProps) {
  const t = useTranslations('profile.account')
  const router = useRouter()

  // Consents state
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [isLoadingConsents, setIsLoadingConsents] = useState(true)

  // Load consent history on mount
  useEffect(() => {
    async function loadConsents() {
      try {
        const result = await getConsentHistory()
        if (result.consents) {
          setConsents(result.consents)
        }
      } catch (error) {
        console.error('Failed to load consents:', error)
      } finally {
        setIsLoadingConsents(false)
      }
    }
    loadConsents()
  }, [])

  // Leave church state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveConfirmation, setLeaveConfirmation] = useState('')
  const [isLeaving, setIsLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmationText = t('confirmationText')

  const handleLeaveChurch = async () => {
    if (leaveConfirmation !== confirmationText) {
      setLeaveError(t('confirmationMismatch'))
      return
    }

    setIsLeaving(true)
    setLeaveError(null)

    const result = await leaveChurch(leaveReason || undefined)

    if (result.error) {
      setLeaveError(result.error)
      setIsLeaving(false)
      return
    }

    // Redirect to onboarding so user can create or join a new church
    router.push('/onboarding')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== confirmationText) {
      setDeleteError(t('confirmationMismatch'))
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    const result = await deleteAccount(deleteReason || undefined)

    if (result.error) {
      setDeleteError(result.error)
      setIsDeleting(false)
      return
    }

    // Redirect to sign-in page after deletion
    router.push('/auth/signin')
  }

  const resetLeaveDialog = () => {
    setShowLeaveDialog(false)
    setLeaveReason('')
    setLeaveConfirmation('')
    setLeaveError(null)
  }

  const resetDeleteDialog = () => {
    setShowDeleteDialog(false)
    setDeleteReason('')
    setDeleteConfirmation('')
    setDeleteError(null)
  }

  return (
    <>
      <Card className="border-0 shadow-none !ring-0">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consents Section */}
          <ActiveConsentsCard consents={consents} isLoading={isLoadingConsents} />
          <ConsentHistoryCard consents={consents} />

          <div className="border-t border-black/20 dark:border-white/20" />

          {/* Leave Church Section */}
          <div className="border border-black/20 dark:border-white/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <LogOut className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">{t('leave.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('leave.description', { churchName })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(true)}
              className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              {t('leave.button')}
            </Button>
          </div>

          {/* Delete Account Section */}
          <div className="border border-black/20 dark:border-white/20 rounded-lg p-4 space-y-3 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-destructive">{t('delete.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('delete.description')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              {t('delete.button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Church Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={(open) => !open && resetLeaveDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('leave.dialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('leave.dialog.description', {
                churchName,
                bold: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {leaveError && (
              <Alert variant="destructive">
                <AlertDescription>{leaveError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="leave-reason">{t('leave.dialog.reasonLabel')}</Label>
              <Textarea
                id="leave-reason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder={t('leave.dialog.reasonPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('leave.dialog.reasonHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leave-confirmation">{t('leave.dialog.confirmationLabel')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('leave.dialog.confirmationHint', { text: confirmationText })}
              </p>
              <Input
                id="leave-confirmation"
                value={leaveConfirmation}
                onChange={(e) => setLeaveConfirmation(e.target.value)}
                placeholder={confirmationText}
                className="placeholder:text-gray-400 text-foreground"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLeaving}
              className="!border-0"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleLeaveChurch()
              }}
              disabled={isLeaving || leaveConfirmation !== confirmationText}
              style={{ backgroundColor: '#ef4444', color: 'white' }}
              className="hover:bg-red-600"
            >
              {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLeaving ? t('leave.dialog.processing') : t('leave.dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && resetDeleteDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              {t('delete.dialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {deleteError && (
              <Alert variant="destructive">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {t('delete.dialog.warning')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="delete-reason">{t('delete.dialog.reasonLabel')}</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('delete.dialog.reasonPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('delete.dialog.reasonHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">{t('delete.dialog.confirmationLabel')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('delete.dialog.confirmationHint', { text: confirmationText })}
              </p>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={confirmationText}
                className="placeholder:text-gray-400 text-foreground"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="!border-0"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAccount()
              }}
              disabled={isDeleting || deleteConfirmation !== confirmationText}
              style={{ backgroundColor: '#ef4444', color: 'white' }}
              className="hover:bg-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? t('delete.dialog.processing') : t('delete.dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
