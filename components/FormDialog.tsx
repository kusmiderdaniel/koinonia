'use client'

import { memo, ReactNode, FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
}

interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Optional dialog description (shown below title) */
  description?: string
  /** Dialog content (form fields, etc.) */
  children: ReactNode
  /** Text for the submit button */
  submitLabel?: string
  /** Text for the cancel button */
  cancelLabel?: string
  /** Whether the form is submitting (shows loading state) */
  isSubmitting?: boolean
  /** Whether the submit button should be disabled (in addition to isSubmitting) */
  submitDisabled?: boolean
  /** Callback when form is submitted */
  onSubmit: (e: FormEvent) => void
  /** Dialog size - defaults to 'md' */
  size?: DialogSize
  /** Additional className for DialogContent */
  className?: string
  /** Error message to display above footer */
  error?: string | null
  /** Whether to prevent auto-focus on open */
  preventAutoFocus?: boolean
}

/**
 * Reusable form dialog built on shadcn/ui Dialog.
 * Provides consistent styling and structure for form-based dialogs.
 *
 * @example
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create Ministry"
 *   description="Add a new ministry to your church."
 *   submitLabel="Create"
 *   isSubmitting={isCreating}
 *   onSubmit={handleSubmit}
 * >
 *   <div className="space-y-4">
 *     <Input ... />
 *     <Textarea ... />
 *   </div>
 * </FormDialog>
 */
export const FormDialog = memo(function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
  size = 'md',
  className = '',
  error,
  preventAutoFocus = false,
}: FormDialogProps) {
  const sizeClass = DIALOG_SIZE_CLASSES[size]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${sizeClass} ${className}`}
        onOpenAutoFocus={preventAutoFocus ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline-pill"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="!border !border-black dark:!border-white"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant="outline-pill"
              size="sm"
              disabled={isSubmitting || submitDisabled}
              className="!bg-brand hover:!bg-brand/90 !text-brand-foreground !border-brand"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

interface SimpleDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Optional dialog description (shown below title) */
  description?: string
  /** Dialog content */
  children: ReactNode
  /** Dialog size - defaults to 'md' */
  size?: DialogSize
  /** Additional className for DialogContent */
  className?: string
  /** Footer content (optional - if not provided, no footer is shown) */
  footer?: ReactNode
  /** Whether to prevent auto-focus on open */
  preventAutoFocus?: boolean
}

/**
 * Simple dialog without form handling.
 * Use for displaying content without a form.
 *
 * @example
 * <SimpleDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Details"
 *   footer={<Button onClick={() => setIsOpen(false)}>Close</Button>}
 * >
 *   <p>Some content here...</p>
 * </SimpleDialog>
 */
export const SimpleDialog = memo(function SimpleDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  className = '',
  footer,
  preventAutoFocus = false,
}: SimpleDialogProps) {
  const sizeClass = DIALOG_SIZE_CLASSES[size]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${sizeClass} ${className}`}
        onOpenAutoFocus={preventAutoFocus ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
})
