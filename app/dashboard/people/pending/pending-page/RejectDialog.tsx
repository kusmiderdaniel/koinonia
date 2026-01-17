'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { PendingRegistration } from './types'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: PendingRegistration | null
  rejectReason: string
  onRejectReasonChange: (value: string) => void
  onConfirm: () => void
}

export function RejectDialog({
  open,
  onOpenChange,
  registration,
  rejectReason,
  onRejectReasonChange,
  onConfirm,
}: RejectDialogProps) {
  const t = useTranslations('people')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!border !border-black dark:!border-white">
        <DialogHeader>
          <DialogTitle>{t('rejectDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('rejectDialog.description', { name: `${registration?.first_name} ${registration?.last_name}` })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">{t('rejectDialog.reasonLabel')}</Label>
          <Textarea
            id="reason"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder={t('rejectDialog.reasonPlaceholder')}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="!border-0"
            onClick={() => onOpenChange(false)}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            className="!bg-red-600 hover:!bg-red-700 !text-brand-foreground !border !border-red-600"
            onClick={onConfirm}
          >
            {t('rejectDialog.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
