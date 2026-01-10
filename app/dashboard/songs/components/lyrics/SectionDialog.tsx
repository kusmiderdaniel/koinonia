'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSongSection, updateSongSection } from '../../actions/song-sections'
import {
  SECTION_TYPES,
  type SongSection,
  type SectionType,
} from '../../types'

interface SectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string
  section?: SongSection // If provided, we're editing
  onSuccess: () => void
}

export function SectionDialog({
  open,
  onOpenChange,
  songId,
  section,
  onSuccess,
}: SectionDialogProps) {
  const t = useTranslations('songs')
  const isEditing = !!section

  const [sectionType, setSectionType] = useState<SectionType>('VERSE')
  const [sectionNumber, setSectionNumber] = useState(1)
  const [label, setLabel] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes or section changes
  useEffect(() => {
    if (open) {
      if (section) {
        setSectionType(section.section_type)
        setSectionNumber(section.section_number)
        setLabel(section.label || '')
        setLyrics(section.lyrics)
      } else {
        setSectionType('VERSE')
        setSectionNumber(1)
        setLabel('')
        setLyrics('')
      }
      setError(null)
    }
  }, [open, section])

  // Show number input for types that typically have multiple instances
  const showNumberInput = ['VERSE', 'BRIDGE', 'INTERLUDE'].includes(sectionType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lyrics.trim()) {
      setError(t('sectionDialog.lyricsRequired'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    const data = {
      sectionType,
      sectionNumber: showNumberInput ? sectionNumber : 1,
      label: label.trim() || null,
      lyrics: lyrics.trim(),
    }

    const result = isEditing
      ? await updateSongSection(section.id, data)
      : await createSongSection(songId, data)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('sectionDialog.editTitle') : t('sectionDialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Section Type */}
            <div className="space-y-2">
              <Label htmlFor="sectionType">{t('sectionDialog.typeLabel')}</Label>
              <Select
                value={sectionType}
                onValueChange={(value) => setSectionType(value as SectionType)}
              >
                <SelectTrigger id="sectionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-black dark:border-white">
                  {SECTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`sectionTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Number (conditional) */}
            {showNumberInput && (
              <div className="space-y-2">
                <Label htmlFor="sectionNumber">{t('sectionDialog.numberLabel')}</Label>
                <Input
                  id="sectionNumber"
                  type="number"
                  min={1}
                  value={sectionNumber}
                  onChange={(e) => setSectionNumber(parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          {/* Custom Label (optional) */}
          <div className="space-y-2">
            <Label htmlFor="label">
              {t('sectionDialog.customLabel')}{' '}
              <span className="text-muted-foreground font-normal">{t('sectionDialog.optional')}</span>
            </Label>
            <Input
              id="label"
              placeholder={t('sectionDialog.customLabelPlaceholder', { type: t(`sectionTypes.${sectionType}`) })}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <Label htmlFor="lyrics">{t('sectionDialog.lyricsLabel')}</Label>
            <Textarea
              id="lyrics"
              placeholder={t('sectionDialog.lyricsPlaceholder')}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="gap-2 pt-2 pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="!bg-brand hover:!bg-brand/90 !text-white !border-0"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? t('sectionDialog.saving')
                  : t('sectionDialog.adding')
                : isEditing
                  ? t('sectionDialog.save')
                  : t('sectionDialog.addButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
