'use client'

import { useState, useCallback } from 'react'

/**
 * Generic hook for managing dialog state with an optional associated item.
 * Useful for create/edit dialogs where you need to track what item is being edited.
 *
 * @example
 * // Basic usage
 * const dialog = useDialogState<Event>()
 *
 * // Open for creating (no item)
 * dialog.open()
 *
 * // Open for editing (with item)
 * dialog.open(event)
 *
 * // In JSX
 * <Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen}>
 *   <EventForm event={dialog.item} onClose={dialog.close} />
 * </Dialog>
 */
export interface DialogState<T> {
  /** Whether the dialog is currently open */
  isOpen: boolean
  /** The item being edited, or null for create mode */
  item: T | null
  /** Open the dialog, optionally with an item for editing */
  open: (item?: T) => void
  /** Close the dialog and clear the item */
  close: () => void
  /** Direct setter for open state (useful for Dialog onOpenChange) */
  setOpen: (open: boolean) => void
}

export function useDialogState<T = unknown>(): DialogState<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | null>(null)

  const open = useCallback((itemToEdit?: T) => {
    setItem(itemToEdit ?? null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setItem(null)
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setItem(null)
    }
  }, [])

  return {
    isOpen,
    item,
    open,
    close,
    setOpen,
  }
}

/**
 * Generic hook for managing confirmation dialogs with loading state.
 * Useful for delete confirmations or other async actions that need user confirmation.
 *
 * @example
 * const deleteDialog = useConfirmDialog<Event>()
 *
 * // Open confirmation for an item
 * deleteDialog.open(event)
 *
 * // Handle confirmation with async action
 * const handleDelete = async () => {
 *   deleteDialog.setLoading(true)
 *   const result = await deleteEvent(deleteDialog.item!.id)
 *   deleteDialog.setLoading(false)
 *   if (!result.error) {
 *     deleteDialog.close()
 *   }
 * }
 *
 * // In JSX
 * <ConfirmDialog
 *   open={deleteDialog.isOpen}
 *   onOpenChange={deleteDialog.setOpen}
 *   onConfirm={handleDelete}
 *   isLoading={deleteDialog.isLoading}
 * />
 */
export interface ConfirmDialogState<T> {
  /** Whether the dialog is currently open */
  isOpen: boolean
  /** The item being confirmed for action */
  item: T | null
  /** Whether the confirmation action is in progress */
  isLoading: boolean
  /** Open the dialog with an item */
  open: (item: T) => void
  /** Close the dialog and clear state */
  close: () => void
  /** Direct setter for open state */
  setOpen: (open: boolean) => void
  /** Set the loading state */
  setLoading: (loading: boolean) => void
}

export function useConfirmDialog<T = unknown>(): ConfirmDialogState<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const open = useCallback((itemToConfirm: T) => {
    setItem(itemToConfirm)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setItem(null)
    setIsLoading(false)
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setItem(null)
      setIsLoading(false)
    }
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  return {
    isOpen,
    item,
    isLoading,
    open,
    close,
    setOpen,
    setLoading,
  }
}

/**
 * Generic hook for managing picker/selector dialogs with an associated context item.
 * Useful for pickers where you need to know which parent item the selection is for.
 *
 * @example
 * const volunteerPicker = usePickerDialog<Position>()
 *
 * // Open picker for a specific position
 * volunteerPicker.open(position)
 *
 * // In JSX
 * <VolunteerPicker
 *   open={volunteerPicker.isOpen}
 *   position={volunteerPicker.item}
 *   onClose={volunteerPicker.close}
 * />
 */
export interface PickerDialogState<T> {
  /** Whether the picker is currently open */
  isOpen: boolean
  /** The context item (e.g., which position we're picking a volunteer for) */
  item: T | null
  /** Open the picker with a context item */
  open: (item: T) => void
  /** Close the picker */
  close: () => void
  /** Direct setter for open state */
  setOpen: (open: boolean) => void
}

export function usePickerDialog<T = unknown>(): PickerDialogState<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | null>(null)

  const open = useCallback((contextItem: T) => {
    setItem(contextItem)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setItem(null)
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setItem(null)
    }
  }, [])

  return {
    isOpen,
    item,
    open,
    close,
    setOpen,
  }
}
