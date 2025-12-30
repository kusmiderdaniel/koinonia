'use client'

import { useCallback } from 'react'
import { useDialogState, useConfirmDialog } from '@/lib/hooks'
import { deleteSong } from '../actions'
import type { Song } from '../types'

interface UseSongDialogsReturn {
  // Dialog states
  songDialogOpen: boolean
  editingSong: Song | null
  deleteDialogOpen: boolean
  deletingSong: Song | null
  isDeleting: boolean

  // Actions
  openCreateDialog: () => void
  openEditDialog: (song: Song) => void
  closeDialog: () => void
  setSongDialogOpen: (open: boolean) => void

  openDeleteDialog: (song: Song) => void
  closeDeleteDialog: () => void
  handleDeleteSong: (
    selectedSongId: string | null,
    onSuccess: () => void
  ) => Promise<{ error?: string }>
}

export function useSongDialogs(): UseSongDialogsReturn {
  // Use generic dialog hooks
  const songDialog = useDialogState<Song>()
  const deleteDialog = useConfirmDialog<Song>()

  const handleDeleteSong = useCallback(async (
    selectedSongId: string | null,
    onSuccess: () => void
  ): Promise<{ error?: string }> => {
    if (!deleteDialog.item) return { error: 'No song selected' }

    deleteDialog.setLoading(true)
    const result = await deleteSong(deleteDialog.item.id)

    if (result.success) {
      onSuccess()
      deleteDialog.close()
      return {}
    }

    deleteDialog.setLoading(false)
    return { error: result.error || 'Failed to delete song' }
  }, [deleteDialog])

  return {
    // Dialog states - map to existing API for backward compatibility
    songDialogOpen: songDialog.isOpen,
    editingSong: songDialog.item,
    deleteDialogOpen: deleteDialog.isOpen,
    deletingSong: deleteDialog.item,
    isDeleting: deleteDialog.isLoading,

    // Actions - map to existing API
    openCreateDialog: () => songDialog.open(),
    openEditDialog: songDialog.open,
    closeDialog: songDialog.close,
    setSongDialogOpen: songDialog.setOpen,
    openDeleteDialog: deleteDialog.open,
    closeDeleteDialog: deleteDialog.close,
    handleDeleteSong,
  }
}
