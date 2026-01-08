'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { SelectableCard } from '@/components/cards'
import { Clock, Key } from 'lucide-react'
import { formatDuration } from '@/lib/utils/format'
import type { Song } from '../types'

interface SongCardProps {
  song: Song
  isSelected: boolean
  onClick: () => void
}

export const SongCard = memo(function SongCard({ song, isSelected, onClick }: SongCardProps) {
  return (
    <SelectableCard isSelected={isSelected} onClick={onClick} variant="bordered">
      <p className="font-medium truncate">{song.title}</p>
      {song.artist && (
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      )}
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {song.default_key && (
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            {song.default_key}
          </span>
        )}
        {song.duration_seconds && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(song.duration_seconds)}
          </span>
        )}
      </div>
      {song.tags && song.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {song.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs rounded-full px-2 py-0"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {song.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs rounded-full px-2 py-0">
              +{song.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </SelectableCard>
  )
})
