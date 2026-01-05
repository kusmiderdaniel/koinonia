'use client'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Registration</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject {registration?.first_name}{' '}
            {registration?.last_name}&apos;s registration?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder="Provide a reason for rejection..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="!border !border-gray-300"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="!bg-red-600 hover:!bg-red-700 !text-white !border !border-red-600"
            onClick={onConfirm}
          >
            Reject Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
