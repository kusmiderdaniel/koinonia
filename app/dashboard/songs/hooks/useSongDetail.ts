'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSong, getAttachmentUrl, deleteAttachment, uploadAttachment } from '../actions'
import type { Song } from '../types'

interface UseSongDetailReturn {
  // Data
  selectedSong: Song | null

  // State
  isUploading: boolean
  isDeletingAttachment: string | null

  // Actions
  loadSongDetail: (songId: string) => Promise<void>
  clearSongDetail: () => void
  downloadAttachment: (attachmentId: string) => Promise<void>
  removeAttachment: (attachmentId: string) => Promise<{ success: boolean }>
  uploadSongAttachment: (songId: string, formData: FormData) => Promise<{ success: boolean }>
}

export function useSongDetail(): UseSongDetailReturn {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingAttachment, setIsDeletingAttachment] = useState<string | null>(null)

  const loadSongDetail = useCallback(async (songId: string) => {
    const result = await getSong(songId)
    if (result.data) {
      setSelectedSong(result.data)
    }
  }, [])

  const clearSongDetail = useCallback(() => {
    setSelectedSong(null)
  }, [])

  const downloadAttachment = useCallback(async (attachmentId: string) => {
    const result = await getAttachmentUrl(attachmentId)
    if (result.data) {
      window.open(result.data, '_blank')
    }
  }, [])

  const removeAttachment = useCallback(async (attachmentId: string): Promise<{ success: boolean }> => {
    setIsDeletingAttachment(attachmentId)
    const result = await deleteAttachment(attachmentId)
    setIsDeletingAttachment(null)
    return { success: result.success || false }
  }, [])

  const uploadSongAttachment = useCallback(async (songId: string, formData: FormData): Promise<{ success: boolean }> => {
    setIsUploading(true)
    const result = await uploadAttachment(songId, formData)
    setIsUploading(false)
    return { success: !!result.data }
  }, [])

  return {
    // Data
    selectedSong,

    // State
    isUploading,
    isDeletingAttachment,

    // Actions
    loadSongDetail,
    clearSongDetail,
    downloadAttachment,
    removeAttachment,
    uploadSongAttachment,
  }
}
