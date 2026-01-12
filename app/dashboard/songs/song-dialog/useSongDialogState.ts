'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTags, getArtists, createSong, updateSong } from '../actions'
import type { Tag, Song, SongInput } from './types'

interface UseSongDialogStateOptions {
  customAction?: (data: SongInput) => Promise<{ error?: string }>
}

export function useSongDialogState(
  open: boolean,
  song: Song | null | undefined,
  options?: UseSongDialogStateOptions
) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, song])

  const handleArtistCreated = useCallback((newArtist: string) => {
    if (!availableArtists.includes(newArtist)) {
      setAvailableArtists((prev) => [...prev, newArtist].sort())
    }
  }, [availableArtists])

  const handleMinutesChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setDurationMinutes(cleaned)
    }
  }, [])

  const handleSecondsChange = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setDurationSeconds(cleaned)
      }
    }
  }, [])

  const handleTagsChange = useCallback((tagIds: string[]) => {
    setSelectedTagIds(tagIds)
  }, [])

  const handleTagCreated = useCallback((newTag: Tag) => {
    setAvailableTags((prev) => [...prev, newTag])
    setSelectedTagIds((prev) => [...prev, newTag.id])
  }, [])

  const handleKeySelect = useCallback((key: string) => {
    setDefaultKey(key)
    setKeyPickerOpen(false)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent, onSuccess: () => void) => {
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

      const data: SongInput = {
        title: title.trim(),
        artist: artist.trim() || undefined,
        defaultKey: defaultKey || undefined,
        durationSeconds: totalDurationSeconds,
        tagIds: selectedTagIds,
      }

      // Use custom action if provided, otherwise use default create/update
      const result = options?.customAction
        ? await options.customAction(data)
        : isEditing
          ? await updateSong(song!.id, data)
          : await createSong(data)

      if ('error' in result && result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      onSuccess()
    },
    [
      title,
      artist,
      defaultKey,
      durationMinutes,
      durationSeconds,
      selectedTagIds,
      isEditing,
      song,
      options,
    ]
  )

  return {
    // Form values
    title,
    setTitle,
    artist,
    setArtist,
    defaultKey,
    durationMinutes,
    durationSeconds,
    selectedTagIds,
    availableTags,
    availableArtists,

    // State
    isLoading,
    error,
    isEditing,
    keyPickerOpen,
    setKeyPickerOpen,

    // Handlers
    handleMinutesChange,
    handleSecondsChange,
    handleTagsChange,
    handleTagCreated,
    handleArtistCreated,
    handleKeySelect,
    handleSubmit,
  }
}
