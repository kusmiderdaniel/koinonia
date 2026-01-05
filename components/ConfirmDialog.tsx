'use client'

import { memo, ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-white disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: destructive ? '#dc2626' : '#f49f1e' }}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
})
