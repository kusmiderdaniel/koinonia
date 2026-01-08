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
import { toast } from 'sonner'
import { createAgendaPreset, updateAgendaPreset } from './actions'
import { formatDurationInputs } from '@/lib/utils/format'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

interface AgendaPresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset: Preset | null
  ministries: Ministry[]
  onSuccess: (preset: Preset, isNew: boolean) => void
}

export function AgendaPresetDialog({
  open,
  onOpenChange,
  preset,
  ministries,
  onSuccess,
}: AgendaPresetDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('5')
  const [durationSeconds, setDurationSeconds] = useState('00')
  const [ministryId, setMinistryId] = useState<string>('none')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!preset

  useEffect(() => {
    if (open) {
      if (preset) {
        setTitle(preset.title)
        setDescription(preset.description || '')
        const { minutes, seconds } = formatDurationInputs(preset.duration_seconds)
        setDurationMinutes(minutes)
        setDurationSeconds(seconds)
        setMinistryId(preset.ministry_id || 'none')
      } else {
        setTitle('')
        setDescription('')
        setDurationMinutes('5')
        setDurationSeconds('00')
        setMinistryId('none')
      }
      setError(null)
    }
  }, [open, preset])

  const handleMinutesChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setDurationMinutes(cleaned)
    }
  }

  const handleSecondsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setDurationSeconds(cleaned)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const mins = parseInt(durationMinutes, 10) || 0
    const secs = parseInt(durationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    if (totalSeconds <= 0) {
      setError('Duration must be greater than 0')
      setIsLoading(false)
      return
    }

    const data = {
      title,
      description: description || undefined,
      durationSeconds: totalSeconds,
      ministryId: ministryId === 'none' ? null : ministryId,
    }

    const result = isEditing
      ? await updateAgendaPreset(preset.id, data)
      : await createAgendaPreset(data)

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      toast.success(isEditing ? 'Agenda item updated' : 'Agenda item created')
      onSuccess(result.data as Preset, !isEditing)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agenda Item' : 'Add Agenda Item'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the agenda item details. Changes won\'t affect items already added to events.'
              : 'Create a reusable agenda item for your events and templates.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
                {error}
              </div>
            )}

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

            <div className="space-y-2">
              <Label>Duration (MM:SS) *</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={durationMinutes}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={durationSeconds}
                  onChange={(e) => handleSecondsChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="SS"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ministry</Label>
              <Select value={ministryId} onValueChange={setMinistryId}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue placeholder="Select a ministry..." />
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectItem value="none">No ministry assigned</SelectItem>
                  {ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ministry.color }}
                        />
                        {ministry.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes or details..."
                rows={3}
              />
            </div>
          </div>

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
              disabled={isLoading || !title.trim()}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Agenda Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
