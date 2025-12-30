'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, Plus, Music, Clock, Key, ChevronDown, ArrowLeft, X } from 'lucide-react'
import { SmartVirtualizedList } from '@/components/VirtualizedList'
import { getSongsForAgenda, getSongTags, addSongToAgenda, createSongAndAddToAgenda, replaceSongPlaceholder } from '../actions'
import { createTag } from '../../songs/actions'
import { formatDuration } from '@/lib/utils/format'

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

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
  tags: Tag[]
}

interface SongPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
  replaceAgendaItemId?: string | null
}

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
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [tagFilterOpen, setTagFilterOpen] = useState(false)

  // Create new song mode
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newDurationMinutes, setNewDurationMinutes] = useState('0')
  const [newDurationSeconds, setNewDurationSeconds] = useState('00')
  const [newTagIds, setNewTagIds] = useState<string[]>([])
  const [keyPickerOpen, setKeyPickerOpen] = useState(false)
  const [newTagPickerOpen, setNewTagPickerOpen] = useState(false)

  // Create new tag state
  const [showCreateTagForm, setShowCreateTagForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreatingTag, setIsCreatingTag] = useState(false)

  useEffect(() => {
    if (open) {
      loadSongs()
      loadTags()
      setSearchQuery('')
      setFilterTagIds([])
      setIsCreatingNew(false)
      setError(null)
      // Reset create tag form
      setShowCreateTagForm(false)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
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

  // Filter songs (uses debounced search for performance)
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      // Search filter (title, artist) - debounced
      if (debouncedSearchQuery.trim()) {
        const searchLower = debouncedSearchQuery.toLowerCase()
        const matchesSearch =
          song.title.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Tag filter
      if (filterTagIds.length > 0) {
        const songTagIds = song.tags?.map((t) => t.id) || []
        const hasAllTags = filterTagIds.every((tagId) => songTagIds.includes(tagId))
        if (!hasAllTags) return false
      }

      return true
    })
  }, [songs, debouncedSearchQuery, filterTagIds])

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
    setNewTitle(searchQuery.trim())
    setNewArtist('')
    setNewKey('')
    setNewDurationMinutes('0')
    setNewDurationSeconds('00')
    setNewTagIds([])
    setIsCreatingNew(true)
  }

  const handleBackToList = () => {
    setIsCreatingNew(false)
    setNewTitle('')
    setNewArtist('')
    setNewKey('')
    setNewDurationMinutes('0')
    setNewDurationSeconds('00')
    setNewTagIds([])
  }

  const handleMinutesChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setNewDurationMinutes(cleaned)
    }
  }

  const handleSecondsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setNewDurationSeconds(cleaned)
      }
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return

    setIsAdding(true)
    setError(null)

    // Calculate duration in seconds
    const mins = parseInt(newDurationMinutes, 10) || 0
    const secs = parseInt(newDurationSeconds, 10) || 0
    const totalSecs = mins * 60 + secs

    const result = await createSongAndAddToAgenda(eventId, {
      title: newTitle.trim(),
      artist: newArtist.trim() || undefined,
      defaultKey: newKey || undefined,
      durationSeconds: totalSecs > 0 ? totalSecs : undefined,
      tagIds: newTagIds,
      replaceAgendaItemId: replaceAgendaItemId || undefined,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const toggleFilterTag = (tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const toggleNewTag = (tagId: string) => {
    setNewTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return

    setIsCreatingTag(true)
    const result = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
    })

    if (result.data) {
      // Add the new tag to allTags and select it
      setAllTags((prev) => [...prev, result.data!])
      setNewTagIds((prev) => [...prev, result.data!.id])
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateTagForm(false)
    }
    setIsCreatingTag(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 max-w-xl w-[95vw] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCreatingNew ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-2"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                Add New Song
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Add Song to Agenda
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew
              ? 'Create a new song and add it to the agenda.'
              : replaceAgendaItemId
              ? 'Select a song to replace this placeholder.'
              : 'Select a song from your library or create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        {isCreatingNew ? (
          // Create new song form
          <div className="space-y-4 py-2 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="space-y-2">
              <Label htmlFor="newTitle">Title *</Label>
              <Input
                id="newTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Song title"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newArtist">Artist</Label>
              <Input
                id="newArtist"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                placeholder="Artist or band name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Key */}
              <div className="space-y-2">
                <Label>Key</Label>
                <Popover open={keyPickerOpen} onOpenChange={setKeyPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between !border !border-input">
                      {newKey || <span className="text-muted-foreground">Select</span>}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2 bg-white dark:bg-zinc-950 border" align="start">
                    <div className="text-xs font-semibold text-muted-foreground px-1 py-1">Major</div>
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setNewKey(k)
                            setKeyPickerOpen(false)
                          }}
                          className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                            newKey === k
                              ? 'bg-brand text-brand-foreground'
                              : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">Minor</div>
                    <div className="grid grid-cols-5 gap-1">
                      {['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'C#m', 'Ebm', 'F#m', 'G#m', 'Bbm'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setNewKey(k)
                            setKeyPickerOpen(false)
                          }}
                          className={`px-2 py-1.5 text-sm rounded-md transition-colors ${
                            newKey === k
                              ? 'bg-brand text-brand-foreground'
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
                    value={newDurationMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-14 text-center"
                    maxLength={2}
                  />
                  <span className="text-lg font-medium text-muted-foreground">:</span>
                  <Input
                    value={newDurationSeconds}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-14 text-center"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Popover open={newTagPickerOpen} onOpenChange={setNewTagPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto min-h-10 py-2 !border !border-input">
                    {newTagIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {newTagIds.map((tagId) => {
                          const tag = allTags.find((t) => t.id === tagId)
                          return tag ? (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                              className="text-white text-xs rounded-full"
                            >
                              {tag.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select tags</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-white dark:bg-zinc-950 border" align="start">
                  {/* Existing Tags */}
                  {allTags.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {allTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleNewTag(tag.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                            newTagIds.includes(tag.id)
                              ? 'bg-gray-100 dark:bg-zinc-800'
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm">{tag.name}</span>
                          {newTagIds.includes(tag.id) && (
                            <span className="ml-auto text-brand">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  {allTags.length > 0 && <div className="border-t my-3" />}

                  {/* Create New Tag */}
                  {showCreateTagForm ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCreateNewTag()
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-6 h-6 rounded-full transition-all ${
                              newTagColor === color
                                ? 'ring-2 ring-offset-1 ring-gray-400'
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setShowCreateTagForm(false)
                            setNewTagName('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          onClick={handleCreateNewTag}
                          disabled={!newTagName.trim() || isCreatingTag}
                        >
                          {isCreatingTag ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowCreateTagForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create new tag
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
              <Button variant="outline-pill-muted" onClick={handleBackToList} disabled={isAdding}>
                Back
              </Button>
              <Button
                onClick={handleCreateAndAdd}
                disabled={isAdding || !newTitle.trim()}
                className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
              >
                {isAdding ? 'Creating...' : 'Create & Add'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Song list
          <>
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or artist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 rounded-full">
                        Tags
                        {filterTagIds.length > 0 && (
                          <Badge className="ml-1 h-5 px-1.5 text-xs bg-brand text-brand-foreground rounded-full">
                            {filterTagIds.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-white dark:bg-zinc-950 border" align="start">
                      <div className="space-y-1">
                        {allTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => toggleFilterTag(tag.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                              filterTagIds.includes(tag.id)
                                ? 'bg-gray-100 dark:bg-zinc-800'
                                : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm">{tag.name}</span>
                            {filterTagIds.includes(tag.id) && (
                              <span className="ml-auto text-brand">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Show selected filter tags */}
                  {filterTagIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filterTagIds.map((tagId) => {
                        const tag = allTags.find((t) => t.id === tagId)
                        return tag ? (
                          <Badge
                            key={tag.id}
                            style={{ backgroundColor: tag.color }}
                            className="text-white text-xs cursor-pointer rounded-full"
                            onClick={() => toggleFilterTag(tag.id)}
                          >
                            {tag.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Song List */}
            {isLoading ? (
              <p className="text-center py-4 text-muted-foreground">Loading songs...</p>
            ) : (
              <SmartVirtualizedList
                items={filteredSongs}
                estimateSize={88}
                className="min-h-[200px] max-h-[300px] py-2"
                virtualizationThreshold={50}
                emptyMessage={
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {songs.length === 0
                        ? 'No songs in your library yet'
                        : 'No songs match your search'}
                    </p>
                  </div>
                }
                renderItem={(song) => (
                  <button
                    key={song.id}
                    onClick={() => handleSelectSong(song)}
                    disabled={isAdding}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{song.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {song.artist && <span>{song.artist}</span>}
                        {song.default_key && (
                          <>
                            {song.artist && <span>•</span>}
                            <span className="flex items-center gap-0.5">
                              <Key className="w-3 h-3" />
                              {song.default_key}
                            </span>
                          </>
                        )}
                        {song.duration_seconds && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDuration(song.duration_seconds)}
                            </span>
                          </>
                        )}
                      </div>
                      {song.tags && song.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {song.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                              className="text-white text-xs py-0 rounded-full"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {song.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs py-0 rounded-full">
                              +{song.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                )}
              />
            )}

            {/* Create new button */}
            <div className="border-t pt-3">
              <Button
                onClick={handleStartCreateNew}
                disabled={isAdding}
                variant="outline"
                className="w-full rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Song
              </Button>
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
              <Button variant="outline-pill-muted" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
