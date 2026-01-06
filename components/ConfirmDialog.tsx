'use client'

import { memo, ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Dialog description - can include JSX for bold text etc */
  description: ReactNode
  /** Text for the confirm button */
  confirmLabel?: string
  /** Text for the cancel button */
  cancelLabel?: string
  /** Whether the confirm action is destructive (shows red button) */
  destructive?: boolean
  /** Whether the action is in progress (disables buttons) */
  isLoading?: boolean
  /** Callback when confirm is clicked */
  onConfirm: () => void
}

/**
 * Reusable confirmation dialog built on AlertDialog.
 * Commonly used for delete confirmations.
 *
 * @example
 * // Delete confirmation
 * <ConfirmDialog
 *   open={isDeleteOpen}
 *   onOpenChange={setIsDeleteOpen}
 *   title="Delete Event?"
 *   description={<>Are you sure you want to delete <strong>{event.title}</strong>? This action cannot be undone.</>}
 *   confirmLabel="Delete"
 *   destructive
 *   isLoading={isDeleting}
 *   onConfirm={handleDelete}
 * />
 */
export const ConfirmDialog = memo(function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            variant="outline-pill"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="!border !border-black dark:!border-white"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="outline-pill"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={destructive
              ? "!border !border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
              : "!border !border-brand !bg-brand !text-brand-foreground hover:!bg-brand/90"
            }
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
})
