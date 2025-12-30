'use client'

import { memo } from 'react'
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
import { toDateString, formatDate } from '../types'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Unavailability</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
            {selectedStart && selectedEnd && (
              <>
                {toDateString(selectedStart) === toDateString(selectedEnd) ? (
                  <span className="font-medium">{formatDate(toDateString(selectedStart))}</span>
                ) : (
                  <span className="font-medium">
                    {formatDate(toDateString(selectedStart))} -{' '}
                    {formatDate(toDateString(selectedEnd))}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Vacation, Family event..."
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
