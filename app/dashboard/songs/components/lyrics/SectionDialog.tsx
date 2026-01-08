'use client'

import { useState, useEffect } from 'react'
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
  SECTION_TYPE_LABELS,
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
      setError('Lyrics are required')
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
            {isEditing ? 'Edit Section' : 'Add Section'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Section Type */}
            <div className="space-y-2">
              <Label htmlFor="sectionType">Type</Label>
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
                      {SECTION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Number (conditional) */}
            {showNumberInput && (
              <div className="space-y-2">
                <Label htmlFor="sectionNumber">Number</Label>
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
              Custom Label{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="label"
              placeholder={`e.g., "${SECTION_TYPE_LABELS[sectionType]} 1" or custom name`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              placeholder="Enter lyrics for this section..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="!bg-brand hover:!bg-brand/90 !text-white !border-0"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? 'Saving...'
                  : 'Adding...'
                : isEditing
                  ? 'Save'
                  : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
