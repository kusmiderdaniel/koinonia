'use client'

import { memo, ReactNode } from 'react'
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
        <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
          <AlertDialogCancel
            className="rounded-full border-input bg-white dark:bg-zinc-950 px-4 py-2"
            disabled={isLoading}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={destructive
              ? '!rounded-full !bg-red-600 hover:!bg-red-700 !text-white !px-4 !py-2 disabled:!opacity-50'
              : '!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50'}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})
