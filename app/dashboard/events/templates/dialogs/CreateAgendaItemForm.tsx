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
import { handleMinutesChange, handleSecondsChange } from './shared'
import type { Ministry } from './types'

interface CreateAgendaItemFormProps {
  isAdding: boolean
  error: string | null
  ministries: Ministry[]
  newTitle: string
  setNewTitle: (value: string) => void
  newMinistryId: string
  setNewMinistryId: (value: string) => void
  newDurationMinutes: string
  setNewDurationMinutes: (value: string) => void
  newDurationSeconds: string
  setNewDurationSeconds: (value: string) => void
  onBack: () => void
  onCreate: () => void
}

export function CreateAgendaItemForm({
  isAdding,
  error,
  ministries,
  newTitle,
  setNewTitle,
  newMinistryId,
  setNewMinistryId,
  newDurationMinutes,
  setNewDurationMinutes,
  newDurationSeconds,
  setNewDurationSeconds,
  onBack,
  onCreate,
}: CreateAgendaItemFormProps) {
  return (
    <>
      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
          {error}
        </div>
      )}

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
          <Label>Ministry *</Label>
          <Select value={newMinistryId} onValueChange={setNewMinistryId}>
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
              value={newDurationMinutes}
              onChange={(e) =>
                handleMinutesChange(e.target.value, setNewDurationMinutes)
              }
              onFocus={(e) => e.target.select()}
              className="w-16 text-center"
              placeholder="MM"
              maxLength={2}
            />
            <span className="text-lg font-medium text-muted-foreground">:</span>
            <Input
              value={newDurationSeconds}
              onChange={(e) =>
                handleSecondsChange(e.target.value, setNewDurationSeconds)
              }
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
            onClick={onCreate}
            disabled={isAdding || !newTitle.trim() || !newMinistryId}
            className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
          >
            {isAdding ? 'Creating...' : 'Create & Add'}
          </Button>
        </DialogFooter>
      </div>
    </>
  )
}
