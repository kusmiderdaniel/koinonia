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
import { DatePicker } from '@/components/ui/date-picker'
import { Trash2 } from 'lucide-react'

export interface EditDialogProps {
  open: boolean
  editingId: string | null
  startDate: string
  endDate: string
  reason: string
  error: string
  isSaving: boolean
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  onOpenChange: (open: boolean) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onReasonChange: (reason: string) => void
  onSave: () => void
  onDelete: (id: string) => void
  onCancel: () => void
}

export const EditDialog = memo(function EditDialog({
  open,
  editingId,
  startDate,
  endDate,
  reason,
  error,
  isSaving,
  firstDayOfWeek = 0,
  onOpenChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSave,
  onDelete,
  onCancel,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Unavailability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={onStartDateChange}
                placeholder="Select date"
                weekStartsOn={firstDayOfWeek}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                placeholder="Select date"
                weekStartsOn={firstDayOfWeek}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editReason">Reason (optional)</Label>
            <Textarea
              id="editReason"
              placeholder="e.g., Vacation, Family event..."
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline-pill"
            className="!border !border-red-600 text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950"
            onClick={() => editingId && onDelete(editingId)}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline-pill"
              className="!border !border-black dark:!border-white"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
