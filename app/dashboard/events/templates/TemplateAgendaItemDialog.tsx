'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Music, Search, Plus, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import { addTemplateAgendaItem, updateTemplateAgendaItem, getMinistries } from './actions'
import { getAgendaPresets } from '@/app/dashboard/settings/agenda-presets/actions'
import { formatDuration } from '@/lib/utils/format'

interface AgendaItem {
  id?: string
  title?: string
  description?: string | null
  duration_seconds?: number
  is_song_placeholder?: boolean
  ministry_id?: string | null
  ministry?: { id: string; name: string } | null
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

interface TemplateAgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  item: AgendaItem | null
  onSuccess: () => void
}

export function TemplateAgendaItemDialog({
  open,
  onOpenChange,
  templateId,
  item,
  onSuccess,
}: TemplateAgendaItemDialogProps) {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create new preset mode
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newMinistryId, setNewMinistryId] = useState<string>('')
  const [newDurationMinutes, setNewDurationMinutes] = useState('5')
  const [newDurationSeconds, setNewDurationSeconds] = useState('00')

  // Edit mode state
  const [editTitle, setEditTitle] = useState('')
  const [editMinistryId, setEditMinistryId] = useState<string>('')
  const [editDurationMinutes, setEditDurationMinutes] = useState('5')
  const [editDurationSeconds, setEditDurationSeconds] = useState('00')

  const isSongPlaceholder = item?.is_song_placeholder || false
  const isEditing = !!item?.id

  useEffect(() => {
    if (open) {
      loadData()
      setSearchQuery('')
      setIsCreatingNew(false)
      setNewMinistryId('')
      setError(null)

      // If editing, populate edit fields
      if (item?.id) {
        setEditTitle(item.title || '')
        setEditMinistryId(item.ministry_id || '')
        const totalSeconds = item.duration_seconds || 300
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setEditDurationMinutes(mins.toString())
        setEditDurationSeconds(secs.toString().padStart(2, '0'))
      }
    }
  }, [open, item])

  const loadData = async () => {
    setIsLoading(true)
    const [ministriesResult, presetsResult] = await Promise.all([
      getMinistries(),
      getAgendaPresets(),
    ])
    if (ministriesResult.data) {
      setMinistries(ministriesResult.data)
    }
    if (presetsResult.data) {
      setPresets(presetsResult.data as Preset[])
    }
    setIsLoading(false)
  }

  const filteredPresets = useMemo(() => {
    return presets.filter((p) =>
      p.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [presets, debouncedSearchQuery])

  const showCreateOption = searchQuery.trim() &&
    !filteredPresets.some((p) => p.title.toLowerCase() === searchQuery.toLowerCase())

  const handleSelectPreset = async (preset: Preset) => {
    if (!preset.ministry_id) {
      setError('This preset has no ministry assigned. Please edit it in Settings first.')
      return
    }

    setIsAdding(true)
    setError(null)

    const result = await addTemplateAgendaItem(templateId, {
      title: preset.title,
      description: preset.description || undefined,
      durationSeconds: preset.duration_seconds,
      ministryId: preset.ministry_id,
      isSongPlaceholder: false,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const handleStartCreateNew = () => {
    setNewTitle(searchQuery.trim())
    setNewMinistryId('')
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
    setIsCreatingNew(true)
  }

  const handleMinutesChange = (value: string, isEdit: boolean) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      if (isEdit) {
        setEditDurationMinutes(cleaned)
      } else {
        setNewDurationMinutes(cleaned)
      }
    }
  }

  const handleSecondsChange = (value: string, isEdit: boolean) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        if (isEdit) {
          setEditDurationSeconds(cleaned)
        } else {
          setNewDurationSeconds(cleaned)
        }
      }
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return

    if (!newMinistryId) {
      setError('Please select a ministry')
      return
    }

    const mins = parseInt(newDurationMinutes, 10) || 0
    const secs = parseInt(newDurationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    setIsAdding(true)
    setError(null)

    const result = await addTemplateAgendaItem(templateId, {
      title: newTitle.trim(),
      durationSeconds: totalSeconds > 0 ? totalSeconds : 60,
      ministryId: newMinistryId,
      isSongPlaceholder: false,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const handleBackToList = () => {
    setIsCreatingNew(false)
    setNewTitle('')
    setNewMinistryId('')
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
  }

  const handleUpdateItem = async () => {
    if (!item?.id) return

    const mins = parseInt(editDurationMinutes, 10) || 0
    const secs = parseInt(editDurationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    setIsAdding(true)
    setError(null)

    const result = await updateTemplateAgendaItem(item.id, {
      title: isSongPlaceholder ? 'Song' : editTitle,
      durationSeconds: isSongPlaceholder ? 300 : totalSeconds,
      ministryId: isSongPlaceholder ? null : (editMinistryId || null),
      isSongPlaceholder,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const handleAddSongPlaceholder = async () => {
    setIsAdding(true)
    setError(null)

    const result = await addTemplateAgendaItem(templateId, {
      title: 'Song',
      durationSeconds: 300,
      isSongPlaceholder: true,
      ministryId: null,
    })

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  // Song placeholder add mode
  if (isSongPlaceholder && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>Add Song Placeholder</DialogTitle>
            <DialogDescription>
              This will create a placeholder for a song to be selected later.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">{error}</div>
          )}

          <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Music className="w-8 h-8 text-purple-500" />
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-100">
                Song Placeholder
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Duration will be set from the song&apos;s default when selected.
              </p>
            </div>
          </div>

          <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSongPlaceholder}
              disabled={isAdding}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isAdding ? 'Adding...' : 'Add Song'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Edit mode (existing item)
  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>
              {isSongPlaceholder ? 'Edit Song Placeholder' : 'Edit Agenda Item'}
            </DialogTitle>
            <DialogDescription>
              Update the agenda item details.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">{error}</div>
          )}

          {isSongPlaceholder ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Music className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  Song Placeholder
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Duration will be set from the song&apos;s default when selected.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="editTitle">Title *</Label>
                <Input
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g., Welcome & Announcements"
                />
              </div>

              <div className="space-y-2">
                <Label>Ministry</Label>
                <Select value={editMinistryId || 'none'} onValueChange={(v) => setEditMinistryId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectValue placeholder="Select a ministry..." />
                  </SelectTrigger>
                  <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectItem value="none">No ministry assigned</SelectItem>
                    {ministries.map((ministry) => (
                      <SelectItem key={ministry.id} value={ministry.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ministry.color }}
                          />
                          {ministry.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (MM:SS) *</Label>
                <div className="flex items-center gap-1">
                  <Input
                    value={editDurationMinutes}
                    onChange={(e) => handleMinutesChange(e.target.value, true)}
                    onFocus={(e) => e.target.select()}
                    className="w-16 text-center"
                    placeholder="MM"
                    maxLength={2}
                  />
                  <span className="text-lg font-medium text-muted-foreground">:</span>
                  <Input
                    value={editDurationSeconds}
                    onChange={(e) => handleSecondsChange(e.target.value, true)}
                    onFocus={(e) => e.target.select()}
                    className="w-16 text-center"
                    placeholder="SS"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={isAdding || (!isSongPlaceholder && !editTitle.trim())}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isAdding ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Add mode - picker style (same as events)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isCreatingNew ? 'Create New Agenda Item' : 'Add Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew
              ? 'Create a new reusable agenda item for your church.'
              : 'Select an existing agenda item or search to create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        {isCreatingNew ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newTitle">Title *</Label>
              <Input
                id="newTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Welcome & Announcements"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Ministry *</Label>
              <Select value={newMinistryId} onValueChange={setNewMinistryId}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue placeholder="Select a ministry..." />
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                  {ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ministry.color }}
                        />
                        {ministry.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration (MM:SS) *</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={newDurationMinutes}
                  onChange={(e) => handleMinutesChange(e.target.value, false)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={newDurationSeconds}
                  onChange={(e) => handleSecondsChange(e.target.value, false)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="SS"
                  maxLength={2}
                />
              </div>
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
              <Button variant="outline-pill-muted" onClick={handleBackToList} disabled={isAdding}>
                Back
              </Button>
              <Button
                onClick={handleCreateAndAdd}
                disabled={isAdding || !newTitle.trim() || !newMinistryId}
                className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
              >
                {isAdding ? 'Creating...' : 'Create & Add'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search agenda items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1 py-2">
              {isLoading ? (
                <p className="text-center py-4 text-muted-foreground">Loading...</p>
              ) : (
                <>
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isAdding || !preset.ministry_id}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{preset.title}</span>
                        {preset.ministry && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: preset.ministry.color }}
                          >
                            {preset.ministry.name}
                          </span>
                        )}
                        {!preset.ministry_id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            No ministry
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDuration(preset.duration_seconds)}
                      </span>
                    </button>
                  ))}

                  {filteredPresets.length === 0 && !showCreateOption && (
                    <p className="text-center py-4 text-muted-foreground">
                      No agenda items found. Start typing to create one.
                    </p>
                  )}

                  {showCreateOption && (
                    <button
                      onClick={handleStartCreateNew}
                      disabled={isAdding}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      <span>
                        Create &quot;<strong>{searchQuery.trim()}</strong>&quot;
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-between items-center pt-4">
              <Button variant="outline-pill-muted" className="border border-black/20 dark:border-white/20" asChild>
                <Link
                  href="/dashboard/settings?tab=presets"
                  className="flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage Agenda Items
                </Link>
              </Button>
              <Button variant="outline-pill-muted" className="border border-black/20 dark:border-white/20" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
