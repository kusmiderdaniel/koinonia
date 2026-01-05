'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Ministry, CreateFormState } from './types'

interface AgendaItemPickerCreateFormProps {
  formState: CreateFormState
  ministries: Ministry[]
  isAdding: boolean
  onTitleChange: (value: string) => void
  onMinistryChange: (value: string) => void
  onMinutesChange: (value: string) => void
  onSecondsChange: (value: string) => void
  onCreateAndAdd: () => void
  onBack: () => void
}

export function AgendaItemPickerCreateForm({
  formState,
  ministries,
  isAdding,
  onTitleChange,
  onMinistryChange,
  onMinutesChange,
  onSecondsChange,
  onCreateAndAdd,
  onBack,
}: AgendaItemPickerCreateFormProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="newTitle">Title *</Label>
        <Input
          id="newTitle"
          value={formState.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Welcome & Announcements"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Ministry *</Label>
        <Select value={formState.ministryId} onValueChange={onMinistryChange}>
          <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
            <SelectValue placeholder="Select a ministry..." />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="bg-white dark:bg-zinc-950 border border-input"
          >
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
        <Label>Duration (MM:SS) *</Label>
        <div className="flex items-center gap-1">
          <Input
            value={formState.durationMinutes}
            onChange={(e) => onMinutesChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            placeholder="MM"
            maxLength={2}
          />
          <span className="text-lg font-medium text-muted-foreground">:</span>
          <Input
            value={formState.durationSeconds}
            onChange={(e) => onSecondsChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            placeholder="SS"
            maxLength={2}
          />
        </div>
      </div>

      <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
        <Button variant="outline-pill-muted" onClick={onBack} disabled={isAdding}>
          Back
        </Button>
        <Button
          onClick={onCreateAndAdd}
          disabled={isAdding || !formState.title.trim() || !formState.ministryId}
          className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
        >
          {isAdding ? 'Creating...' : 'Create & Add'}
        </Button>
      </DialogFooter>
    </div>
  )
}
