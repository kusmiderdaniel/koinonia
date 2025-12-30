'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Music } from 'lucide-react'
import { addTemplateAgendaItem, updateTemplateAgendaItem, getMinistries } from './actions'

interface AgendaItem {
  id?: string
  title?: string
  description?: string | null
  duration_seconds?: number
  is_song_placeholder?: boolean
  ministry_id?: string | null
  ministry?: { id: string; name: string } | null
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface TemplateAgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  item: AgendaItem | null
  onSuccess: () => void
}

export function TemplateAgendaItemDialog({
  open,
  onOpenChange,
  templateId,
  item,
  onSuccess,
}: TemplateAgendaItemDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editMinutes, setEditMinutes] = useState('5')
  const [editSeconds, setEditSeconds] = useState('00')
  const [ministryId, setMinistryId] = useState<string | null>(null)
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSongPlaceholder = item?.is_song_placeholder || false

  useEffect(() => {
    if (open) {
      loadMinistries()
      if (item) {
        setTitle(item.title || (item.is_song_placeholder ? 'Song' : ''))
        setDescription(item.description || '')
        // Convert duration_seconds to minutes and seconds
        const totalSeconds = item.duration_seconds || 300
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setEditMinutes(mins.toString())
        setEditSeconds(secs.toString().padStart(2, '0'))
        setMinistryId(item.ministry_id || null)
      } else {
        setTitle('')
        setDescription('')
        setEditMinutes('5')
        setEditSeconds('00')
        setMinistryId(null)
      }
      setError(null)
    }
  }, [open, item])

  const loadMinistries = async () => {
    const result = await getMinistries()
    if (result.data) {
      setMinistries(result.data)
    }
  }

  const handleMinutesInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setEditMinutes(cleaned)
    }
  }

  const handleSecondsInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setEditSeconds(cleaned)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Calculate duration in seconds
    const mins = parseInt(editMinutes, 10) || 0
    const secs = parseInt(editSeconds, 10) || 0
    const durationSeconds = mins * 60 + secs

    // For song placeholders, we don't need duration - it will be set from song's default duration
    const data = {
      title: isSongPlaceholder ? 'Song' : title,
      description: isSongPlaceholder ? undefined : (description || undefined),
      durationSeconds: isSongPlaceholder ? 300 : durationSeconds, // Default 5 min for songs, actual for items
      isSongPlaceholder,
      ministryId: isSongPlaceholder ? null : (ministryId || null), // Songs don't need ministry in template
    }

    const result = item?.id
      ? await updateTemplateAgendaItem(item.id, data)
      : await addTemplateAgendaItem(templateId, data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onSuccess()
    }
  }

  const isEditing = !!item?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? isSongPlaceholder
                ? 'Edit Song Placeholder'
                : 'Edit Agenda Item'
              : isSongPlaceholder
              ? 'Add Song Placeholder'
              : 'Add Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            {isSongPlaceholder
              ? 'This will create a placeholder for a song to be selected later.'
              : 'Add an item to the template agenda.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
          )}

          {isSongPlaceholder ? (
            // Song placeholder - simplified view
            <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Music className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-100">
                  Song Placeholder
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Duration will be set from the song&apos;s default when selected.
                </p>
              </div>
            </div>
          ) : (
            // Regular agenda item - full form
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Welcome & Announcements"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (MM:SS) *</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={editMinutes}
                      onChange={(e) => handleMinutesInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-16 text-center"
                      placeholder="MM"
                      maxLength={2}
                    />
                    <span className="text-lg font-medium text-muted-foreground">:</span>
                    <Input
                      value={editSeconds}
                      onChange={(e) => handleSecondsInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-16 text-center"
                      placeholder="SS"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ministry">Ministry</Label>
                  <Select
                    value={ministryId || 'none'}
                    onValueChange={(v) => setMinistryId(v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                      <SelectValue placeholder="Select ministry..." />
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      className="bg-white dark:bg-zinc-950 border border-input"
                    >
                      <SelectItem
                        value="none"
                        className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                      >
                        None
                      </SelectItem>
                      {ministries.map((ministry) => (
                        <SelectItem
                          key={ministry.id}
                          value={ministry.id}
                          className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ministry.color }}
                            />
                            {ministry.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes or details..."
                  rows={2}
                />
              </div>
            </>
          )}

          <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!isSongPlaceholder && !title.trim())}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : isSongPlaceholder ? 'Add Song' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
