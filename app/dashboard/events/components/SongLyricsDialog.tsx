'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Music, Loader2 } from 'lucide-react'
import { getSongLyricsForAgenda } from '../actions/agenda/songs'
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_COLORS,
  type SongSection,
} from '@/app/dashboard/songs/types'

interface SongLyricsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string | null
  songTitle: string
  arrangementId: string | null
}

export function SongLyricsDialog({
  open,
  onOpenChange,
  songId,
  songTitle,
  arrangementId,
}: SongLyricsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [sections, setSections] = useState<SongSection[]>([])
  const [arrangementName, setArrangementName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadLyrics = async () => {
    if (!songId) return

    setIsLoading(true)
    setError(null)

    const result = await getSongLyricsForAgenda(songId, arrangementId)

    if (result.error) {
      setError(result.error)
      setSections([])
    } else if (result.data) {
      setSections(result.data.sections)
      setArrangementName(result.data.arrangementName)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (open && songId) {
      loadLyrics()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, songId, arrangementId])

  const getSectionDisplayLabel = (section: SongSection): string => {
    if (section.label) return section.label

    const baseLabel = SECTION_TYPE_LABELS[section.section_type]
    const typesWithNumbers = ['VERSE', 'BRIDGE', 'INTERLUDE']

    if (typesWithNumbers.includes(section.section_type) && section.section_number > 0) {
      return `${baseLabel} ${section.section_number}`
    }

    return baseLabel
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-600" />
            <span className="truncate">{songTitle}</span>
          </DialogTitle>
          {arrangementName && (
            <p className="text-sm text-muted-foreground">
              Arrangement: {arrangementName}
            </p>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No lyrics available for this song.</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {sections.map((section, index) => (
                <div key={`${section.id}-${index}`} className="space-y-2">
                  <Badge
                    className="text-xs text-white rounded-full px-2.5"
                    style={{ backgroundColor: SECTION_TYPE_COLORS[section.section_type] }}
                  >
                    {getSectionDisplayLabel(section)}
                  </Badge>
                  <p className="text-sm whitespace-pre-wrap pl-3 border-l-2 border-muted">
                    {section.lyrics}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
