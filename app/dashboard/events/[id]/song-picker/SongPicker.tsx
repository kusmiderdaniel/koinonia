'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music } from 'lucide-react'
import { getSongsForAgenda, getSongTags, addSongToAgenda, createSongAndAddToAgenda, replaceSongPlaceholder } from '../../actions'
import { SongList } from './SongList'
import { SongDialog } from '@/app/dashboard/songs/song-dialog/SongDialog'
import type { SongInput } from '@/app/dashboard/songs/song-dialog/types'
import type { Song, Tag, SongPickerProps } from './types'

export function SongPicker({
  open,
  onOpenChange,
  eventId,
  onSuccess,
  replaceAgendaItemId,
}: SongPickerProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])

  // Create new song mode
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  useEffect(() => {
    if (open) {
      loadSongs()
      loadTags()
      setSearchQuery('')
      setFilterTagIds([])
      setIsCreatingNew(false)
      setError(null)
    }
  }, [open])

  const loadSongs = async () => {
    setIsLoading(true)
    const result = await getSongsForAgenda()
    if (result.data) {
      setSongs(result.data)
    }
    setIsLoading(false)
  }

  const loadTags = async () => {
    const result = await getSongTags()
    if (result.data) {
      setAllTags(result.data)
    }
  }

  const handleSelectSong = useCallback(async (song: Song) => {
    setIsAdding(true)
    setError(null)

    // If replacing a placeholder, update the existing item instead of creating new
    const result = replaceAgendaItemId
      ? await replaceSongPlaceholder(replaceAgendaItemId, song.id)
      : await addSongToAgenda(eventId, song.id)

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }, [replaceAgendaItemId, eventId, onSuccess])

  const handleStartCreateNew = () => {
    setIsCreatingNew(true)
  }

  const handleBackToList = () => {
    setIsCreatingNew(false)
  }

  const handleCreateAndAdd = useCallback(async (data: SongInput): Promise<{ error?: string }> => {
    const result = await createSongAndAddToAgenda(eventId, {
      title: data.title,
      artist: data.artist,
      defaultKey: data.defaultKey,
      durationSeconds: data.durationSeconds,
      tagIds: data.tagIds,
      replaceAgendaItemId: replaceAgendaItemId || undefined,
    })

    if (result.error) {
      return { error: result.error }
    }

    onSuccess()
    return {}
  }, [eventId, replaceAgendaItemId, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 max-w-xl w-[95vw] max-h-[80vh] flex flex-col overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Add Song to Agenda
          </DialogTitle>
          <DialogDescription>
            {replaceAgendaItemId
              ? 'Select a song to replace this placeholder.'
              : 'Select a song from your library or create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        <SongList
          songs={songs}
          allTags={allTags}
          isLoading={isLoading}
          isAdding={isAdding}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterTagIds={filterTagIds}
          onFilterTagsChange={setFilterTagIds}
          onSelectSong={handleSelectSong}
          onCreateNew={handleStartCreateNew}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>

      {/* Song creation dialog - opens when creating new song */}
      <SongDialog
        open={isCreatingNew}
        onOpenChange={(open) => {
          if (!open) {
            handleBackToList()
          }
        }}
        onSuccess={() => {}}
        customAction={handleCreateAndAdd}
        title="Add New Song"
        submitText="Create & Add"
      />
    </Dialog>
  )
}
