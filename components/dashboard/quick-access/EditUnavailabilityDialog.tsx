'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateUnavailability, deleteUnavailability } from '@/app/dashboard/availability/actions'
import type { UnavailabilityItem } from './types'

interface EditUnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: UnavailabilityItem | null
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  onSuccess: () => void
}

export function EditUnavailabilityDialog({
  open,
  onOpenChange,
  item,
  weekStartsOn = 1,
  onSuccess,
}: EditUnavailabilityDialogProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(item?.start_date || '')
  const [endDate, setEndDate] = useState(item?.end_date || '')
  const [reason, setReason] = useState(item?.reason || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset form when item changes
  const resetForm = useCallback(() => {
    if (item) {
      setStartDate(item.start_date)
      setEndDate(item.end_date)
      setReason(item.reason || '')
    }
  }, [item])

  // Reset when dialog opens with new item
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && item) {
      resetForm()
    }
    onOpenChange(isOpen)
  }, [item, resetForm, onOpenChange])

  const handleSave = useCallback(async () => {
    if (!item || !startDate || !endDate) return

    if (endDate < startDate) {
      toast.error('End date must be on or after start date')
      return
    }

    setIsSaving(true)
    const result = await updateUnavailability(item.id, {
      startDate,
      endDate,
      reason: reason || undefined,
    })

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Unavailability updated')
      onOpenChange(false)
      onSuccess()
      router.refresh()
    }
    setIsSaving(false)
  }, [item, startDate, endDate, reason, router, onOpenChange, onSuccess])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleDelete = useCallback(async () => {
    if (!item) return

    setIsDeleting(true)
    const result = await deleteUnavailability(item.id)

    if (result.success) {
      toast.success('Unavailability deleted')
      onOpenChange(false)
      onSuccess()
      router.refresh()
    } else {
      toast.error('Failed to delete')
    }
    setIsDeleting(false)
  }, [item, router, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                onChange={setStartDate}
                placeholder="Select date"
                weekStartsOn={weekStartsOn}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select date"
                weekStartsOn={weekStartsOn}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editReason">Reason (optional)</Label>
            <Textarea
              id="editReason"
              placeholder="e.g., Vacation, Family event..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            className="rounded-full !border !border-red-600 text-red-600 hover:!bg-red-50 dark:hover:!bg-red-950"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-full !border !border-black dark:!border-white"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
