'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Music, Plus } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ListDetailLayout } from '@/components/layouts'
import { SongsListView, SongDetailPanel } from './components'
import { useSongList, useSongDetail, useSongDialogs } from './hooks'
import type { Song } from './types'

// Dynamic import for dialog (only loaded when opened)
const SongDialog = dynamic(() => import('./song-dialog').then(mod => ({ default: mod.SongDialog })), { ssr: false })

export interface SongsInitialData {
  songs: Song[]
  canManage: boolean
}

interface SongsPageClientProps {
  initialData: SongsInitialData
}

export function SongsPageClient({ initialData }: SongsPageClientProps) {
  // Use custom hooks for state management - pass initial data
  const list = useSongList(initialData)
  const detail = useSongDetail()
  const dialogs = useSongDialogs()

  // Load song details when selection changes
  useEffect(() => {
    if (list.selectedSongId) {
      detail.loadSongDetail(list.selectedSongId)
    } else {
      detail.clearSongDetail()
    }
  }, [list.selectedSongId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handler bridges - memoized to prevent unnecessary re-renders
  const handleSelectSong = useCallback((song: Song) => {
    list.setSelectedSongId(song.id)
  }, [list])

  const handleClearSelection = useCallback(() => {
    list.setSelectedSongId(null)
  }, [list])

  const handleSongDialogSuccess = useCallback(async () => {
    dialogs.closeDialog()
    await list.refreshSongs()
    if (list.selectedSongId) {
      await detail.loadSongDetail(list.selectedSongId)
    }
  }, [dialogs, list, detail])

  const handleDeleteSong = useCallback(async () => {
    const wasSelected = list.selectedSongId === dialogs.deletingSong?.id
    const result = await dialogs.handleDeleteSong(list.selectedSongId, async () => {
      if (wasSelected) {
        list.setSelectedSongId(null)
      }
      await list.refreshSongs()
    })
    if (result.error) {
      console.error(result.error)
    }
  }, [dialogs, list])

  const handleDownloadAttachment = useCallback(async (attachmentId: string) => {
    await detail.downloadAttachment(attachmentId)
  }, [detail])

  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    const result = await detail.removeAttachment(attachmentId)
    if (result.success && list.selectedSongId) {
      await detail.loadSongDetail(list.selectedSongId)
    }
  }, [detail, list.selectedSongId])

  const handleUploadAttachment = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!list.selectedSongId || !e.target.files?.[0]) return

    const formData = new FormData()
    formData.append('file', e.target.files[0])

    const result = await detail.uploadSongAttachment(list.selectedSongId, formData)
    if (result.success) {
      await detail.loadSongDetail(list.selectedSongId)
    }
    e.target.value = ''
  }, [detail, list.selectedSongId])

  // Destructure commonly used values
  const { filteredSongs, songs, tags, selectedSongId, canManage, search, filterTagIds } = list
  const { selectedSong, isUploading, isDeletingAttachment } = detail

  // Header component
  const headerContent = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Songs</h1>
        <p className="text-muted-foreground">
          Manage your song library
        </p>
      </div>
      {canManage && (
        <Button variant="ghost" className="rounded-full !border !border-gray-300 dark:!border-gray-600" onClick={dialogs.openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Song
        </Button>
      )}
    </div>
  )

  // Dialogs
  const dialogsContent = (
    <>
      <SongDialog
        open={dialogs.songDialogOpen}
        onOpenChange={dialogs.setSongDialogOpen}
        song={dialogs.editingSong}
        onSuccess={handleSongDialogSuccess}
      />
      <ConfirmDialog
        open={dialogs.deleteDialogOpen}
        onOpenChange={(open) => !open && dialogs.closeDeleteDialog()}
        title="Delete Song?"
        description={<>Are you sure you want to delete <strong>{dialogs.deletingSong?.title}</strong>? This will also delete all attachments. This action cannot be undone.</>}
        confirmLabel="Delete"
        destructive
        isLoading={dialogs.isDeleting}
        onConfirm={handleDeleteSong}
      />
    </>
  )

  return (
    <ListDetailLayout
      header={headerContent}
      listView={
        <SongsListView
          searchQuery={search}
          onSearchChange={list.setSearch}
          songs={songs}
          filteredSongs={filteredSongs}
          tags={tags}
          filterTagIds={filterTagIds}
          onToggleFilterTag={list.toggleFilterTag}
          onClearFilters={list.clearFilters}
          selectedSongId={selectedSongId}
          onSelectSong={handleSelectSong}
          className="h-full"
        />
      }
      detailView={
        <SongDetailPanel
          song={selectedSong}
          canManage={canManage}
          isUploading={isUploading}
          isDeletingAttachment={isDeletingAttachment}
          onEdit={(song) => dialogs.openEditDialog(song)}
          onDelete={(song) => dialogs.openDeleteDialog(song)}
          onUploadAttachment={handleUploadAttachment}
          onDownloadAttachment={handleDownloadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
        />
      }
      hasSelection={!!selectedSongId && !!selectedSong}
      selectionTitle={selectedSong?.title || 'Song Details'}
      onClearSelection={handleClearSelection}
      emptyIcon={Music}
      emptyTitle="Select a song"
      emptyDescription="Choose a song from the list to view details"
      dialogs={dialogsContent}
    />
  )
}
