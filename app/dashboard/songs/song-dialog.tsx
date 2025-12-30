'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { createSong, updateSong, getTags, getArtists } from './actions'
import { TagPicker } from './tag-picker'
import { ArtistPicker } from './artist-picker'

interface Tag {
  id: string
  name: string
  color: string
}

interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
  tags?: Tag[]
}

interface SongDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song: Song | null
  onSuccess: () => void
}

// Musical keys for the dropdown
const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
]

export const SongDialog = memo(function SongDialog({ open, onOpenChange, song, onSuccess }: SongDialogProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [defaultKey, setDefaultKey] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [availableArtists, setAvailableArtists] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyPickerOpen, setKeyPickerOpen] = useState(false)

  const isEditing = !!song

  useEffect(() => {
    if (open) {
      loadTags()
      loadArtists()
      if (song) {
        setTitle(song.title)
        setArtist(song.artist || '')
        setDefaultKey(song.default_key || '')
        if (song.duration_seconds) {
          const mins = Math.floor(song.duration_seconds / 60)
          const secs = song.duration_seconds % 60
          setDurationMinutes(mins.toString())
          setDurationSeconds(secs.toString().padStart(2, '0'))
        } else {
          setDurationMinutes('0')
          setDurationSeconds('00')
        }
        setSelectedTagIds(song.tags?.map((t) => t.id) || [])
      } else {
        setTitle('')
        setArtist('')
        setDefaultKey('')
        setDurationMinutes('0')
        setDurationSeconds('00')
        setSelectedTagIds([])
      }
      setError('')
    }
  }, [open, song])

  const loadTags = async () => {
    const result = await getTags()
    if (result.data) {
      setAvailableTags(result.data)
    }
  }

  const loadArtists = async () => {
    const result = await getArtists()
    if (result.data) {
      setAvailableArtists(result.data)
    }
  }

  const handleArtistCreated = (newArtist: string) => {
    // Add new artist to the list if not already present
    if (!availableArtists.includes(newArtist)) {
      setAvailableArtists(prev => [...prev, newArtist].sort())
    }
  }

  const handleMinutesChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setDurationMinutes(cleaned)
    }
  }

  const handleSecondsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setDurationSeconds(cleaned)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    // Calculate duration in seconds
    let totalDurationSeconds: number | undefined
    const mins = parseInt(durationMinutes, 10) || 0
    const secs = parseInt(durationSeconds, 10) || 0
    if (secs >= 60) {
      setError('Seconds must be less than 60')
      return
    }
    const totalSecs = mins * 60 + secs
    if (totalSecs > 0) {
      totalDurationSeconds = totalSecs
    }

    setIsLoading(true)

    const data = {
      title: title.trim(),
      artist: artist.trim() || undefined,
      defaultKey: defaultKey || undefined,
      durationSeconds: totalDurationSeconds,
      tagIds: selectedTagIds,
    }

    const result = isEditing
      ? await updateSong(song.id, data)
      : await createSong(data)

    if ('error' in result && result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onSuccess()
  }

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds)
  }

  const handleTagCreated = (newTag: Tag) => {
    setAvailableTags((prev) => [...prev, newTag])
    setSelectedTagIds((prev) => [...prev, newTag.id])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Song' : 'Add Song'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
            />
          </div>

          {/* Artist */}
          <div className="space-y-2">
            <Label>Artist</Label>
            <ArtistPicker
              artists={availableArtists}
              value={artist}
              onChange={setArtist}
              onArtistCreated={handleArtistCreated}
            />
          </div>

          {/* Key and Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Default Key */}
            <div className="space-y-2">
              <Label>Default Key</Label>
              <Popover open={keyPickerOpen} onOpenChange={setKeyPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between !border !border-black dark:!border-zinc-700">
                    {defaultKey || <span className="text-muted-foreground">Select key</span>}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2 bg-white dark:bg-zinc-950 border" align="start">
                  <div className="text-xs font-semibold text-muted-foreground px-1 py-1">Major</div>
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setDefaultKey(k)
                          setKeyPickerOpen(false)
                        }}
                        className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                          defaultKey === k
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">Minor</div>
                  <div className="grid grid-cols-6 gap-1">
                    {['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'C#m', 'Ebm', 'F#m', 'G#m', 'Bbm'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setDefaultKey(k)
                          setKeyPickerOpen(false)
                        }}
                        className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                          defaultKey === k
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={durationMinutes}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={durationSeconds}
                  onChange={(e) => handleSecondsChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagPicker
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onChange={handleTagsChange}
              onTagCreated={handleTagCreated}
            />
          </div>

          <DialogFooter className="pt-4 !bg-transparent !border-t-0">
            <Button
              type="button"
              variant="outline-pill"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white">
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Song'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
