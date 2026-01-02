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
import { Search, Plus, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import { addAgendaItem, getMinistriesWithRoles } from '../actions'
import { getAgendaPresets, createAgendaPreset } from '@/app/dashboard/settings/agenda-presets/actions'
import { formatDuration } from '@/lib/utils/format'

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

interface AgendaItemPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
}

export function AgendaItemPicker({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: AgendaItemPickerProps) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
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

  useEffect(() => {
    if (open) {
      loadPresets()
      loadMinistries()
      setSearchQuery('')
      setIsCreatingNew(false)
      setNewMinistryId('')
      setError(null)
    }
  }, [open])

  const loadMinistries = async () => {
    const result = await getMinistriesWithRoles()
    if (result.data) {
      setMinistries(result.data)
    }
  }

  const loadPresets = async () => {
    setIsLoading(true)
    const result = await getAgendaPresets()
    if (result.data) {
      setPresets(result.data as Preset[])
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

    // Add agenda item from preset data using the preset's ministry
    const result = await addAgendaItem(eventId, {
      title: preset.title,
      description: preset.description || undefined,
      durationSeconds: preset.duration_seconds,
      ministryId: preset.ministry_id,
      sortOrder: 0, // Will be recalculated server-side
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

    if (!newMinistryId) {
      setError('Please select a ministry')
      return
    }

    // Convert MM:SS to seconds
    const mins = parseInt(newDurationMinutes, 10) || 0
    const secs = parseInt(newDurationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    setIsAdding(true)
    setError(null)

    // Add the agenda item (which will auto-save to presets library)
    const result = await addAgendaItem(eventId, {
      title: newTitle.trim(),
      durationSeconds: totalSeconds > 0 ? totalSeconds : 60, // Default to 1 minute if 0
      ministryId: newMinistryId,
      sortOrder: 0, // Will be recalculated server-side
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
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={newDurationSeconds}
                  onChange={(e) => handleSecondsChange(e.target.value)}
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
