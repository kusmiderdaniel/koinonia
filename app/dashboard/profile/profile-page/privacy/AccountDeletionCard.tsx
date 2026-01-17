'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Clock, AlertTriangle, Loader2, X } from 'lucide-react'
import { requestAccountDeletion, cancelAccountDeletion } from '../../actions'
import type { DeletionStatus } from './types'

interface AccountDeletionCardProps {
  initialStatus: DeletionStatus
}

export function AccountDeletionCard({ initialStatus }: AccountDeletionCardProps) {
  const t = useTranslations('legal.privacy')

  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>(initialStatus)
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false)
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionError, setDeletionError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleRequestDeletion = async () => {
    setIsRequestingDeletion(true)
    setDeletionError(null)

    try {
      const result = await requestAccountDeletion(deletionReason || undefined)
      if (result.error) {
        setDeletionError(result.error)
      } else {
        setDeletionStatus({
          status: 'pending',
          scheduledAt: result.scheduledAt,
        })
        setShowDeleteDialog(false)
      }
    } catch (error) {
      setDeletionError(t('deleteAccount.dialogDescription'))
    } finally {
      setIsRequestingDeletion(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsCancellingDeletion(true)

    try {
      const result = await cancelAccountDeletion()
      if (!result.error) {
        setDeletionStatus({ status: 'none' })
      }
    } catch (error) {
      console.error('Failed to cancel deletion:', error)
    } finally {
      setIsCancellingDeletion(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">{t('deleteAccount.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('deleteAccount.description')}</p>
      </div>

      <div>
        {deletionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{deletionError}</AlertDescription>
          </Alert>
        )}

        {deletionStatus.status === 'none' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">{t('deleteAccount.warning')}</p>
                <p className="text-sm mt-1">{t('deleteAccount.warningDescription')}</p>
              </AlertDescription>
            </Alert>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="!border-red-500 !text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/30">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('deleteAccount.button')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccount.dialogTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteAccount.dialogDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletion-reason">{t('deleteAccount.reasonLabel')}</Label>
                    <Textarea
                      id="deletion-reason"
                      placeholder={t('deleteAccount.reasonPlaceholder')}
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('deleteAccount.gracePeriod')}
                  </p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="!border-0">{t('deleteAccount.cancelButton')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestDeletion}
                    disabled={isRequestingDeletion}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isRequestingDeletion ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('deleteAccount.deleting')}
                      </>
                    ) : (
                      t('deleteAccount.confirmButton')
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {deletionStatus.status === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <Clock className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {t('deleteAccount.pendingTitle')}
                </p>
                {deletionStatus.scheduledAt && (
                  <p className="text-sm text-destructive/80">
                    {t('deleteAccount.pendingDescription', {
                      date: formatDate(deletionStatus.scheduledAt),
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCancelDeletion}
              disabled={isCancellingDeletion}
            >
              {isCancellingDeletion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('deleteAccount.cancelling')}
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('deleteAccount.cancelDeletion')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
