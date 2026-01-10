'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Music } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ListDetailLayout } from '@/components/layouts'
import { SongsListView, SongDetailPanel } from './components'
import { useSongList, useSongDetail, useSongDialogs } from './hooks'
import type { Song } from './types'

// Dynamic import for dialog (only loaded when opened)
const SongDialog = dynamic(() => import('./song-dialog/SongDialog').then(mod => ({ default: mod.SongDialog })), { ssr: false })

export interface SongsInitialData {
  songs: Song[]
  canManage: boolean
}

interface SongsPageClientProps {
  initialData: SongsInitialData
}

export function SongsPageClient({ initialData }: SongsPageClientProps) {
  const t = useTranslations('songs')

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

  const handleSongUpdated = useCallback(async () => {
    if (list.selectedSongId) {
      await detail.loadSongDetail(list.selectedSongId)
    }
  }, [detail, list.selectedSongId])

  // Destructure commonly used values
  const { filteredSongs, songs, tags, selectedSongId, canManage, search, filterTagIds } = list
  const { selectedSong, isUploading, isDeletingAttachment } = detail

  // Header component
  const headerContent = (
    <div>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('subtitle')}
      </p>
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
        title={t('deleteDialog.title')}
        description={<>{t('deleteDialog.description', { title: dialogs.deletingSong?.title ?? '' })}</>}
        confirmLabel={t('deleteDialog.confirm')}
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
          onAddClick={dialogs.openCreateDialog}
          canManage={canManage}
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
          onSongUpdated={handleSongUpdated}
        />
      }
      hasSelection={!!selectedSongId && !!selectedSong}
      selectionTitle={selectedSong?.title || t('songDetails')}
      onClearSelection={handleClearSelection}
      emptyIcon={Music}
      emptyTitle={t('selectSong')}
      emptyDescription={t('selectSongDescription')}
      dialogs={dialogsContent}
    />
  )
}
