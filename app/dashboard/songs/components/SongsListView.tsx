'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Music } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { SongCard } from './SongCard'
import type { Song, Tag } from '../types'

interface SongsListViewProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  songs: Song[]
  filteredSongs: Song[]
  tags: Tag[]
  filterTagIds: string[]
  onToggleFilterTag: (tagId: string) => void
  onClearFilters: () => void
  selectedSongId: string | null
  onSelectSong: (song: Song) => void
  onAddClick?: () => void
  canManage?: boolean
  className?: string
}

export function SongsListView({
  searchQuery,
  onSearchChange,
  songs,
  filteredSongs,
  tags,
  filterTagIds,
  onToggleFilterTag,
  onClearFilters,
  selectedSongId,
  onSelectSong,
  onAddClick,
  canManage,
  className,
}: SongsListViewProps) {
  const t = useTranslations('songs')

  return (
    <div className={`flex flex-col border border-black dark:border-zinc-700 rounded-lg bg-card overflow-hidden ${className ?? 'w-full md:w-80 md:flex-shrink-0'}`}>
      {/* Search and Add Button */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          {canManage && onAddClick && (
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0 rounded-full !border !border-black dark:!border-white"
              onClick={onAddClick}
              title={t('addSong')}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="px-3 py-2 border-b">
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={filterTagIds.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer text-xs rounded-full"
                style={filterTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                onClick={() => onToggleFilterTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
            {filterTagIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
                onClick={onClearFilters}
              >
                {t('search.clear')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Song List */}
      <div className="flex-1 overflow-y-auto p-2">
        {songs.length === 0 ? (
          <EmptyState
            icon={Music}
            title={t('search.noSongsYet')}
            description={t('search.noSongsYetDescription')}
            size="sm"
          />
        ) : filteredSongs.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('search.noSongsFound')}
            description={t('search.noSongsFoundDescription')}
            size="sm"
          />
        ) : (
          <div className="space-y-2">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isSelected={selectedSongId === song.id}
                onClick={() => onSelectSong(song)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
