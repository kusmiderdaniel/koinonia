'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CalendarOff, ArrowRight } from 'lucide-react'
import { toDateString } from '../types'

export interface AddDialogProps {
  open: boolean
  selectedStart: Date | null
  selectedEnd: Date | null
  reason: string
  error: string
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onReasonChange: (reason: string) => void
  onSave: () => void
  onCancel: () => void
}

export const AddDialog = memo(function AddDialog({
  open,
  selectedStart,
  selectedEnd,
  reason,
  error,
  isSaving,
  onOpenChange,
  onReasonChange,
  onSave,
  onCancel,
}: AddDialogProps) {
  const t = useTranslations('availability')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('addDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {selectedStart && selectedEnd && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-3">
                <CalendarOff className="h-4 w-4" />
                <span className="text-sm font-medium">{t('addDialog.markingAs')}</span>
              </div>
              {toDateString(selectedStart) === toDateString(selectedEnd) ? (
                <div className="flex justify-center">
                  <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {selectedStart.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">{selectedStart.getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {selectedStart.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">{selectedStart.getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-red-400" />
                  <div className="bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-700 rounded-lg px-4 py-2 text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {selectedEnd.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold">{selectedEnd.getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{t('addDialog.reasonLabel')}</Label>
            <Textarea
              id="reason"
              placeholder={t('addDialog.reasonPlaceholder')}
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
              autoFocus={false}
            />
          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline-pill"
            className="!border !border-black dark:!border-white"
            onClick={onCancel}
            disabled={isSaving}
          >
            {t('addDialog.cancel')}
          </Button>
          <Button
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? t('addDialog.saving') : t('addDialog.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
