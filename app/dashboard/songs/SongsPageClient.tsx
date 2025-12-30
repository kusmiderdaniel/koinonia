'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Music,
  Plus,
  Search,
  Clock,
  Key,
  User,
  FileText,
  Pencil,
  Trash2,
  Download,
  Upload,
  X,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MobileBackHeader } from '@/components/MobileBackHeader'
import { useIsMobile } from '@/lib/hooks'
import { formatDuration } from '@/lib/utils/format'
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
  const isMobile = useIsMobile()

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
  const handleSelectSong = useCallback((songId: string) => {
    list.setSelectedSongId(songId)
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Destructure commonly used values
  const { filteredSongs, songs, tags, selectedSongId, canManage, search, filterTagIds } = list
  const { selectedSong, isUploading, isDeletingAttachment } = detail

  // Song Detail Component (reused in mobile and desktop)
  const SongDetailContent = () => (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl md:text-2xl truncate">{selectedSong!.title}</CardTitle>
          {selectedSong!.artist && (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              {selectedSong!.artist}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => dialogs.openEditDialog(selectedSong!)}
            >
              <Pencil className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dialogs.openDeleteDialog(selectedSong!)}
              className="rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Song Details */}
        <div className="grid grid-cols-2 gap-4">
          {selectedSong!.default_key && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Default Key
              </label>
              <p className="text-lg font-medium flex items-center gap-2 mt-1">
                <Key className="w-4 h-4 text-muted-foreground" />
                {selectedSong!.default_key}
              </p>
            </div>
          )}
          {selectedSong!.duration_seconds && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Duration
              </label>
              <p className="text-lg font-medium flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {formatDuration(selectedSong!.duration_seconds)}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Tags
          </label>
          {selectedSong!.tags && selectedSong!.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSong!.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  className="text-white rounded-full px-3"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags</p>
          )}
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Attachments
            </label>
            {canManage && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleUploadAttachment}
                  disabled={isUploading}
                />
                <Button variant="outline" size="sm" className="rounded-full" asChild disabled={isUploading}>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    {isUploading ? 'Uploading...' : 'Upload PDF'}
                  </span>
                </Button>
              </label>
            )}
          </div>
          {selectedSong!.song_attachments && selectedSong!.song_attachments.length > 0 ? (
            <div className="space-y-2">
              {selectedSong!.song_attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        disabled={isDeletingAttachment === attachment.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDeletingAttachment === attachment.id ? (
                          <span className="w-4 h-4">...</span>
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attachments</p>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Song List Component (reused in mobile and desktop)
  const SongListContent = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Songs</h1>
        </div>
        {canManage && (
          <Button size="sm" className="rounded-full" onClick={dialogs.openCreateDialog}>
            <Plus className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">Add</span>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => list.setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={filterTagIds.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer text-xs rounded-full"
              style={filterTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              onClick={() => list.toggleFilterTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {filterTagIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs"
              onClick={list.clearFilters}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Songs List */}
      <ScrollArea className="flex-1">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {songs.length === 0 ? (
              <>
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No songs yet</p>
                {canManage && (
                  <p className="text-sm mt-1">Add your first song to get started</p>
                )}
              </>
            ) : (
              <p>No songs match your search</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 pr-2">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSongId === song.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-muted/50'
                }`}
              >
                <div className="font-medium truncate">{song.title}</div>
                {song.artist && (
                  <div className="text-sm text-muted-foreground truncate">
                    {song.artist}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {song.duration_seconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration_seconds)}
                    </span>
                  )}
                  {song.default_key && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {song.default_key}
                    </span>
                  )}
                </div>
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {song.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs rounded-full"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  // Mobile: Show detail view with back button
  if (isMobile && selectedSongId && selectedSong) {
    return (
      <div className="h-full p-4">
        <MobileBackHeader
          title={selectedSong.title}
          onBack={handleClearSelection}
        />
        <SongDetailContent />

        {/* Dialogs */}
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
      </div>
    )
  }

  // Mobile list view
  if (isMobile) {
    return (
      <div className="h-full p-4">
        <SongListContent className="h-[calc(100vh-140px)]" />

        {/* Dialogs */}
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
      </div>
    )
  }

  // Desktop: side-by-side layout
  return (
    <div className="h-full p-6">
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Left Panel - Song List */}
        <SongListContent className="w-80 flex-shrink-0" />

        {/* Right Panel - Song Detail */}
        <div className="flex-1 min-w-0">
          {selectedSong ? (
            <SongDetailContent />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Music className="w-16 h-16 mb-4 opacity-30" />
              <p>Select a song to view details</p>
            </div>
          )}
        </div>

        {/* Song Dialog */}
        <SongDialog
          open={dialogs.songDialogOpen}
          onOpenChange={dialogs.setSongDialogOpen}
          song={dialogs.editingSong}
          onSuccess={handleSongDialogSuccess}
        />

        {/* Delete Confirmation */}
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
      </div>
    </div>
  )
}
