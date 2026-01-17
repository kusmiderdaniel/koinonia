'use client'

import React, { useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Music } from 'lucide-react'
import { SmartVirtualizedList } from '@/components/VirtualizedList'
import { SongListItem } from './SongListItem'
import { TagFilter } from './TagFilter'
import type { Song, Tag } from './types'

interface SongListProps {
  songs: Song[]
  allTags: Tag[]
  isLoading: boolean
  isAdding: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  filterTagIds: string[]
  onFilterTagsChange: (tagIds: string[]) => void
  onSelectSong: (song: Song) => void
  onCreateNew: () => void
  onClose: () => void
}

export function SongList({
  songs,
  allTags,
  isLoading,
  isAdding,
  searchQuery,
  onSearchChange,
  filterTagIds,
  onFilterTagsChange,
  onSelectSong,
  onCreateNew,
  onClose,
}: SongListProps) {
  const t = useTranslations('events.songPicker')
  const tCommon = useTranslations('common.buttons')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [tagFilterOpen, setTagFilterOpen] = React.useState(false)

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

  const toggleFilterTag = useCallback((tagId: string) => {
    onFilterTagsChange(
      filterTagIds.includes(tagId)
        ? filterTagIds.filter((id) => id !== tagId)
        : [...filterTagIds, tagId]
    )
  }, [filterTagIds, onFilterTagsChange])

  return (
    <>
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 !border-black/20 dark:!border-white/20"
          />
        </div>

        {/* Tag filter */}
        <TagFilter
          allTags={allTags}
          filterTagIds={filterTagIds}
          tagFilterOpen={tagFilterOpen}
          onTagFilterOpenChange={setTagFilterOpen}
          onToggleTag={toggleFilterTag}
        />
      </div>

      {/* Song List */}
      {isLoading ? (
        <p className="text-center py-4 text-muted-foreground">{t('loading')}</p>
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
                  ? t('noSongs')
                  : t('noMatch')}
              </p>
            </div>
          }
          renderItem={(song) => (
            <SongListItem
              key={song.id}
              song={song}
              isDisabled={isAdding}
              onSelect={onSelectSong}
            />
          )}
        />
      )}

      {/* Create new button */}
      <div className="border-t border-black/20 dark:border-white/20 pt-3">
        <Button
          onClick={onCreateNew}
          disabled={isAdding}
          variant="outline"
          className="w-full rounded-full !border-black/20 dark:!border-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('createNew')}
        </Button>
      </div>

      <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose} className="rounded-full">
          {tCommon('cancel')}
        </Button>
      </DialogFooter>
    </>
  )
}
