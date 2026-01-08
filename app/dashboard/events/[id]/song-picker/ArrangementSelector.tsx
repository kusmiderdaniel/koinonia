'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Star, ListMusic } from 'lucide-react'
import type { Song, Arrangement } from './types'

interface ArrangementSelectorProps {
  song: Song
  onSelectArrangement: (arrangementId: string | null) => void
  onBack: () => void
  isAdding: boolean
}

export function ArrangementSelector({
  song,
  onSelectArrangement,
  onBack,
  isAdding,
}: ArrangementSelectorProps) {
  const arrangements = song.arrangements || []

  // If no arrangements, use default (null)
  if (arrangements.length === 0) {
    onSelectArrangement(null)
    return null
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
          disabled={isAdding}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{song.title}</h3>
          {song.artist && (
            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          )}
        </div>
      </div>

      {/* Arrangement selection */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex items-center gap-2 mb-3">
          <ListMusic className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Select arrangement</span>
        </div>

        <div className="space-y-2">
          {arrangements.map((arrangement) => (
            <button
              key={arrangement.id}
              className="w-full text-left p-3 border rounded-lg hover:border-brand hover:bg-muted/50 transition-colors disabled:opacity-50"
              onClick={() => onSelectArrangement(arrangement.id)}
              disabled={isAdding}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{arrangement.name}</span>
                {arrangement.is_default && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Star className="w-3 h-3" />
                    Default
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Choose which arrangement to use for this event
        </p>
      </div>
    </div>
  )
}
