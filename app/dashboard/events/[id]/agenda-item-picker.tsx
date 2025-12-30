'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Search, Plus, Clock } from 'lucide-react'
import { getAgendaTemplates, createAgendaTemplate, addAgendaItemFromTemplate, getMinistriesWithRoles } from '../actions'

interface Template {
  id: string
  title: string
  default_duration_minutes: number
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface AgendaItemPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
}

export function AgendaItemPicker({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: AgendaItemPickerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create new template mode
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDurationMinutes, setNewDurationMinutes] = useState('5')
  const [newDurationSeconds, setNewDurationSeconds] = useState('00')

  useEffect(() => {
    if (open) {
      loadTemplates()
      loadMinistries()
      setSearchQuery('')
      setIsCreatingNew(false)
      setSelectedMinistryId('')
      setError(null)
    }
  }, [open])

  const loadMinistries = async () => {
    const result = await getMinistriesWithRoles()
    if (result.data) {
      setMinistries(result.data)
    }
  }

  const loadTemplates = async () => {
    setIsLoading(true)
    const result = await getAgendaTemplates()
    if (result.data) {
      setTemplates(result.data)
    }
    setIsLoading(false)
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) =>
      t.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    )
  }, [templates, debouncedSearchQuery])

  const showCreateOption = searchQuery.trim() &&
    !filteredTemplates.some((t) => t.title.toLowerCase() === searchQuery.toLowerCase())

  const handleSelectTemplate = async (template: Template) => {
    if (!selectedMinistryId) {
      setError('Please select a ministry first')
      return
    }

    setIsAdding(true)
    setError(null)

    const result = await addAgendaItemFromTemplate(eventId, template.id, selectedMinistryId)

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const handleStartCreateNew = () => {
    setNewTitle(searchQuery.trim())
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
    setIsCreatingNew(true)
  }

  const handleMinutesChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setNewDurationMinutes(cleaned)
    }
  }

  const handleSecondsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setNewDurationSeconds(cleaned)
      }
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return

    if (!selectedMinistryId) {
      setError('Please select a ministry first')
      return
    }

    // Convert MM:SS to seconds
    const mins = parseInt(newDurationMinutes, 10) || 0
    const secs = parseInt(newDurationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs
    // Templates still use minutes, so we round for the template but use exact seconds for the agenda item
    const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60))

    setIsAdding(true)
    setError(null)

    // First create the template
    const templateResult = await createAgendaTemplate(newTitle.trim(), totalMinutes)

    if (templateResult.error) {
      setError(templateResult.error)
      setIsAdding(false)
      return
    }

    // Then add it to the event with the exact duration in seconds
    if (templateResult.data) {
      const addResult = await addAgendaItemFromTemplate(eventId, templateResult.data.id, selectedMinistryId, {
        durationSeconds: totalSeconds > 0 ? totalSeconds : 60, // Default to 1 minute if 0
      })

      if (addResult.error) {
        setError(addResult.error)
        setIsAdding(false)
        return
      }
    }

    setIsAdding(false)
    onSuccess()
  }

  const handleBackToList = () => {
    setIsCreatingNew(false)
    setNewTitle('')
    setNewDurationMinutes('5')
    setNewDurationSeconds('00')
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}:00`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}:00`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isCreatingNew ? 'Create New Agenda Item' : 'Add Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew
              ? 'Create a new reusable agenda item for your church.'
              : 'Select an existing agenda item or create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        {/* Ministry selector - always visible */}
        <div className="space-y-2">
          <Label>Responsible Ministry *</Label>
          <Select value={selectedMinistryId} onValueChange={setSelectedMinistryId}>
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
              <SelectValue placeholder="Select a ministry..." />
            </SelectTrigger>
            <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
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

        {isCreatingNew ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newTitle">Title *</Label>
              <Input
                id="newTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Welcome & Announcements"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Default Duration (MM:SS) *</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={newDurationMinutes}
                  onChange={(e) => handleMinutesChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={newDurationSeconds}
                  onChange={(e) => handleSecondsChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="SS"
                  maxLength={2}
                />
              </div>
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
              <Button variant="outline-pill-muted" onClick={handleBackToList} disabled={isAdding}>
                Back
              </Button>
              <Button
                onClick={handleCreateAndAdd}
                disabled={isAdding || !newTitle.trim()}
                className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
              >
                {isAdding ? 'Creating...' : 'Create & Add'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search agenda items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1 py-2">
              {isLoading ? (
                <p className="text-center py-4 text-muted-foreground">Loading...</p>
              ) : (
                <>
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      disabled={isAdding}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                      <span className="font-medium">{template.title}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDuration(template.default_duration_minutes)}
                      </span>
                    </button>
                  ))}

                  {filteredTemplates.length === 0 && !showCreateOption && (
                    <p className="text-center py-4 text-muted-foreground">
                      No agenda items found. Start typing to create one.
                    </p>
                  )}

                  {showCreateOption && (
                    <button
                      onClick={handleStartCreateNew}
                      disabled={isAdding}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      <span>
                        Create &quot;<strong>{searchQuery.trim()}</strong>&quot;
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
              <Button variant="outline-pill-muted" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
