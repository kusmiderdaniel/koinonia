'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue, queryKeys, useCacheInvalidation } from '@/lib/hooks'
import { getSongs } from '../actions'
import type { Song, Tag } from '../types'

export interface SongsInitialData {
  songs: Song[]
  canManage: boolean
}

interface UseSongListReturn {
  // Data
  songs: Song[]
  tags: Tag[]
  selectedSongId: string | null
  filteredSongs: Song[]

  // State
  isLoading: boolean
  canManage: boolean

  // Search and filter
  search: string
  filterTagIds: string[]

  // Actions
  setSelectedSongId: (id: string | null) => void
  setSearch: (search: string) => void
  setFilterTagIds: (ids: string[]) => void
  toggleFilterTag: (tagId: string) => void
  clearFilters: () => void
  refreshSongs: () => Promise<void>
}

export function useSongList(initialData?: SongsInitialData): UseSongListReturn {
  const { invalidateSongs } = useCacheInvalidation()

  // Local UI state
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])

  // React Query with initialData for instant render
  const songsQuery = useQuery({
    queryKey: queryKeys.songs,
    queryFn: async () => {
      const result = await getSongs()
      if (result.error) {
        throw new Error(result.error)
      }
      return {
        songs: result.data || [],
        canManage: result.canManage || false,
      }
    },
    initialData: initialData ? {
      songs: initialData.songs,
      canManage: initialData.canManage,
    } : undefined,
    staleTime: 60 * 1000, // Data fresh for 1 minute
    refetchOnWindowFocus: false,
  })

  // Extract data from query with defaults
  const songs = songsQuery.data?.songs ?? []
  const canManage = songsQuery.data?.canManage ?? false
  const isLoading = songsQuery.isLoading

  // Extract unique tags from all songs (memoized)
  const tags = useMemo(() => {
    const allTags = new Map<string, Tag>()
    songs.forEach((song: Song) => {
      song.tags?.forEach((tag: Tag) => {
        allTags.set(tag.id, tag)
      })
    })
    return Array.from(allTags.values())
  }, [songs])

  // Filter songs by search and tags (uses debounced search for performance)
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      // Search filter (debounced)
      if (debouncedSearch.trim()) {
        const searchLower = debouncedSearch.toLowerCase()
        const matchesSearch =
          song.title.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Tag filter
      if (filterTagIds.length > 0) {
        const songTagIds = song.tags?.map((t: Tag) => t.id) || []
        const hasAllTags = filterTagIds.every((tagId) => songTagIds.includes(tagId))
        if (!hasAllTags) return false
      }

      return true
    })
  }, [songs, debouncedSearch, filterTagIds])

  const toggleFilterTag = useCallback((tagId: string) => {
    setFilterTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setFilterTagIds([])
  }, [])

  // Refresh function that uses React Query invalidation
  const refreshSongs = useCallback(async () => {
    await invalidateSongs()
  }, [invalidateSongs])

  return {
    // Data
    songs,
    tags,
    selectedSongId,
    filteredSongs,

    // State
    isLoading,
    canManage,

    // Search and filter
    search,
    filterTagIds,

    // Actions
    setSelectedSongId,
    setSearch,
    setFilterTagIds,
    toggleFilterTag,
    clearFilters,
    refreshSongs,
  }
}
