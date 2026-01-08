'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addTemplateAgendaItem, updateTemplateAgendaItem, getMinistries } from '../actions'
import { getAgendaPresets } from '@/app/dashboard/settings/agenda-presets/actions'
import { formatDurationInputs } from '@/lib/utils/format'
import { parseDuration } from './shared'
import { SongPlaceholderAddDialog } from './SongPlaceholderAddDialog'
import { EditAgendaItemDialog } from './EditAgendaItemDialog'
import { PresetPickerContent } from './PresetPickerContent'
import { CreateAgendaItemForm } from './CreateAgendaItemForm'
import type { TemplateAgendaItemDialogProps, Ministry, Preset } from './types'

export function TemplateAgendaItemDialog({
  open,
  onOpenChange,
  templateId,
  item,
  onSuccess,
  ministries: preloadedMinistries,
  presets: preloadedPresets,
}: TemplateAgendaItemDialogProps) {
  const [ministries, setMinistries] = useState<Ministry[]>(preloadedMinistries || [])
  const [presets, setPresets] = useState<Preset[]>(preloadedPresets || [])
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

  // Update state when preloaded data changes
  useEffect(() => {
    if (preloadedMinistries) setMinistries(preloadedMinistries)
  }, [preloadedMinistries])

  useEffect(() => {
    if (preloadedPresets) setPresets(preloadedPresets)
  }, [preloadedPresets])

  useEffect(() => {
    if (open) {
      // Only load data if not preloaded
      if (!preloadedMinistries || !preloadedPresets) {
        loadData()
      }
      setSearchQuery('')
      setIsCreatingNew(false)
      setNewMinistryId('')
      setError(null)

      // If editing, populate edit fields
      if (item?.id) {
        setEditTitle(item.title || '')
        setEditMinistryId(item.ministry_id || '')
        const { minutes, seconds } = formatDurationInputs(item.duration_seconds || 300)
        setEditDurationMinutes(minutes)
        setEditDurationSeconds(seconds)
      }
    }
  }, [open, item, preloadedMinistries, preloadedPresets])

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

  const showCreateOption =
    !!searchQuery.trim() &&
    !filteredPresets.some(
      (p) => p.title.toLowerCase() === searchQuery.toLowerCase()
    )

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

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return

    if (!newMinistryId) {
      setError('Please select a ministry')
      return
    }

    const totalSeconds = parseDuration(newDurationMinutes, newDurationSeconds)

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

    const totalSeconds = parseDuration(editDurationMinutes, editDurationSeconds)

    setIsAdding(true)
    setError(null)

    // For song placeholders, find or keep the Worship ministry
    let ministryIdToUse = editMinistryId || null
    if (isSongPlaceholder) {
      const worshipMinistry = ministries.find(m => m.name === 'Worship')
      ministryIdToUse = worshipMinistry?.id || item.ministry_id || null
    }

    const result = await updateTemplateAgendaItem(item.id, {
      title: isSongPlaceholder ? 'Song' : editTitle,
      durationSeconds: isSongPlaceholder ? 300 : totalSeconds,
      ministryId: ministryIdToUse,
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

    // Find the Worship ministry for song placeholders
    const worshipMinistry = ministries.find(m => m.name === 'Worship')

    const result = await addTemplateAgendaItem(templateId, {
      title: 'Song',
      durationSeconds: 300,
      isSongPlaceholder: true,
      ministryId: worshipMinistry?.id || null,
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
      <SongPlaceholderAddDialog
        open={open}
        onOpenChange={onOpenChange}
        isAdding={isAdding}
        error={error}
        onAdd={handleAddSongPlaceholder}
      />
    )
  }

  // Edit mode (existing item)
  if (isEditing) {
    return (
      <EditAgendaItemDialog
        open={open}
        onOpenChange={onOpenChange}
        isSongPlaceholder={isSongPlaceholder}
        isAdding={isAdding}
        error={error}
        ministries={ministries}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editMinistryId={editMinistryId}
        setEditMinistryId={setEditMinistryId}
        editDurationMinutes={editDurationMinutes}
        setEditDurationMinutes={setEditDurationMinutes}
        editDurationSeconds={editDurationSeconds}
        setEditDurationSeconds={setEditDurationSeconds}
        onUpdate={handleUpdateItem}
      />
    )
  }

  // Add mode - picker style
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-zinc-950 max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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

        {isCreatingNew ? (
          <CreateAgendaItemForm
            isAdding={isAdding}
            error={error}
            ministries={ministries}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newMinistryId={newMinistryId}
            setNewMinistryId={setNewMinistryId}
            newDurationMinutes={newDurationMinutes}
            setNewDurationMinutes={setNewDurationMinutes}
            newDurationSeconds={newDurationSeconds}
            setNewDurationSeconds={setNewDurationSeconds}
            onBack={handleBackToList}
            onCreate={handleCreateAndAdd}
          />
        ) : (
          <PresetPickerContent
            isLoading={isLoading}
            isAdding={isAdding}
            error={error}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredPresets={filteredPresets}
            showCreateOption={showCreateOption}
            onSelectPreset={handleSelectPreset}
            onStartCreateNew={handleStartCreateNew}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
