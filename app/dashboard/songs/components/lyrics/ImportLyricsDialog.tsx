'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, AlertCircle, Eye } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { parseLyrics, getSectionDisplayLabel } from '@/lib/utils/lyrics-parser'
import { importSongSections } from '../../actions/song-sections'

interface ImportLyricsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string
  onSuccess: () => void
}

const EXAMPLE_LYRICS = `[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

[Chorus]
I once was lost but now I'm found
Was blind but now I see

[Verse 2]
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed`

export function ImportLyricsDialog({
  open,
  onOpenChange,
  songId,
  onSuccess,
}: ImportLyricsDialogProps) {
  const t = useTranslations('songs')
  const isMobile = useIsMobile()
  const [rawLyrics, setRawLyrics] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileTab, setMobileTab] = useState<'input' | 'preview'>('input')

  // Parse lyrics in real-time
  const parsedSections = useMemo(() => {
    if (!rawLyrics.trim()) return []
    return parseLyrics(rawLyrics)
  }, [rawLyrics])

  const handleSubmit = async () => {
    if (parsedSections.length === 0) {
      setError(t('importDialog.noSectionsFound'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await importSongSections(songId, parsedSections)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    // Reset and close
    setRawLyrics('')
    setIsSubmitting(false)
    onSuccess()
  }

  const handleClose = () => {
    setRawLyrics('')
    setError(null)
    onOpenChange(false)
  }

  const handleLoadExample = () => {
    setRawLyrics(EXAMPLE_LYRICS)
    setError(null)
  }

  // Shared preview content (render function, not a component)
  // eslint-disable-next-line react-hooks/static-components -- This is a render function, not a stateful component
  const PreviewContent = () => (
    <>
      {parsedSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
          <p>{t('importDialog.pasteToPreview')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parsedSections.map((section, index) => (
            <div key={index} className="space-y-1">
              <Badge variant="secondary" className="text-xs">
                {getSectionDisplayLabel(section)}
              </Badge>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-2 border-l-2 border-muted">
                {section.lyrics.split('\n').slice(0, 3).join('\n')}
                {section.lyrics.split('\n').length > 3 && (
                  <span className="text-muted-foreground/60">...</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-h-[90vh] flex flex-col !border !border-black dark:!border-white ${isMobile ? 'w-[95vw] max-w-[95vw] p-4' : 'sm:max-w-3xl'}`}>
        <DialogHeader className={isMobile ? 'pb-2' : ''}>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
            <FileText className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
            {t('importDialog.title')}
          </DialogTitle>
          {!isMobile && (
            <DialogDescription>
              {t('importDialog.description')}
            </DialogDescription>
          )}
        </DialogHeader>

        {isMobile ? (
          // Mobile: Tabbed layout
          <div className="flex-1 flex flex-col min-h-0">
            <div className="grid w-full grid-cols-2 gap-1 mb-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setMobileTab('input')}
                className={`flex items-center justify-center text-xs py-1.5 px-3 rounded-md transition-colors ${
                  mobileTab === 'input'
                    ? 'bg-brand !text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3 h-3 mr-1" />
                {t('importDialog.pasteLyrics')}
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`flex items-center justify-center text-xs py-1.5 px-3 rounded-md transition-colors ${
                  mobileTab === 'preview'
                    ? 'bg-brand !text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3 h-3 mr-1" />
                {t('importDialog.preview')} ({parsedSections.length})
              </button>
            </div>

            {mobileTab === 'input' ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-end mb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadExample}
                    className="text-xs h-6 px-2"
                  >
                    {t('importDialog.loadExample')}
                  </Button>
                </div>
                <Textarea
                  placeholder={`[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me

[Chorus]
I once was lost but now I'm found`}
                  value={rawLyrics}
                  onChange={(e) => {
                    setRawLyrics(e.target.value)
                    setError(null)
                  }}
                  className="h-[250px] font-mono text-xs resize-none !border !border-black/20 dark:!border-white/20"
                />
              </div>
            ) : (
              <ScrollArea className="h-[280px] border border-black/20 dark:border-white/20 rounded-md p-2">
                <PreviewContent />
              </ScrollArea>
            )}
          </div>
        ) : (
          // Desktop: Side-by-side layout
          <div className="grid grid-cols-2 gap-4">
            {/* Input */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 h-6">
                <Label htmlFor="rawLyrics">{t('importDialog.paste')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadExample}
                  className="text-xs h-6 px-2"
                >
                  {t('importDialog.loadExample')}
                </Button>
              </div>
              <Textarea
                id="rawLyrics"
                placeholder={`[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me

[Chorus]
I once was lost but now I'm found
Was blind but now I see`}
                value={rawLyrics}
                onChange={(e) => {
                  setRawLyrics(e.target.value)
                  setError(null)
                }}
                className="h-[350px] font-mono text-sm resize-none !border !border-black/20 dark:!border-white/20"
              />
            </div>

            {/* Preview */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2 h-6">
                <Label>
                  {t('importDialog.previewCount', { count: parsedSections.length })}
                </Label>
              </div>
              <ScrollArea className="h-[350px] border border-black/20 dark:border-white/20 rounded-md p-3">
                <PreviewContent />
              </ScrollArea>
            </div>
          </div>
        )}

        {error && (
          <p className={`text-red-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <AlertCircle className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            {error}
          </p>
        )}

        <DialogFooter className={`gap-2 ${isMobile ? 'py-1' : 'py-2'}`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`rounded-full ${isMobile ? 'text-xs h-8' : ''}`}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            size="sm"
            className={`!bg-brand hover:!bg-brand/90 !text-white dark:!text-black !border-0 ${isMobile ? 'text-xs h-8' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting || parsedSections.length === 0}
          >
            {isSubmitting
              ? t('importDialog.importing')
              : t('importDialog.importButton', { count: parsedSections.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
