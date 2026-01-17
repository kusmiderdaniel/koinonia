'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Music, Clock, Key } from 'lucide-react'
import { formatDuration } from '@/lib/utils/format'
import type { Song } from './types'

interface SongListItemProps {
  song: Song
  isDisabled: boolean
  onSelect: (song: Song) => void
}

export const SongListItem = memo(function SongListItem({
  song,
  isDisabled,
  onSelect,
}: SongListItemProps) {
  return (
    <button
      onClick={() => onSelect(song)}
      disabled={isDisabled}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-black/20 dark:border-white/20 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
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
  )
})
