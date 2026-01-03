'use client'

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
import { Music } from 'lucide-react'
import { handleMinutesChange, handleSecondsChange } from './shared'
import type { Ministry } from './types'

interface EditAgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSongPlaceholder: boolean
  isAdding: boolean
  error: string | null
  ministries: Ministry[]
  editTitle: string
  setEditTitle: (value: string) => void
  editMinistryId: string
  setEditMinistryId: (value: string) => void
  editDurationMinutes: string
  setEditDurationMinutes: (value: string) => void
  editDurationSeconds: string
  setEditDurationSeconds: (value: string) => void
  onUpdate: () => void
}

export function EditAgendaItemDialog({
  open,
  onOpenChange,
  isSongPlaceholder,
  isAdding,
  error,
  ministries,
  editTitle,
  setEditTitle,
  editMinistryId,
  setEditMinistryId,
  editDurationMinutes,
  setEditDurationMinutes,
  editDurationSeconds,
  setEditDurationSeconds,
  onUpdate,
}: EditAgendaItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>
            {isSongPlaceholder ? 'Edit Song Placeholder' : 'Edit Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            Update the agenda item details.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        {isSongPlaceholder ? (
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
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title *</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Welcome & Announcements"
              />
            </div>

            <div className="space-y-2">
              <Label>Ministry</Label>
              <Select
                value={editMinistryId || 'none'}
                onValueChange={(v) => setEditMinistryId(v === 'none' ? '' : v)}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue placeholder="Select a ministry..." />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  className="bg-white dark:bg-zinc-950 border border-input"
                >
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
              <Label>Duration (MM:SS) *</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={editDurationMinutes}
                  onChange={(e) =>
                    handleMinutesChange(e.target.value, setEditDurationMinutes)
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">:</span>
                <Input
                  value={editDurationSeconds}
                  onChange={(e) =>
                    handleSecondsChange(e.target.value, setEditDurationSeconds)
                  }
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  placeholder="SS"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline-pill-muted"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={onUpdate}
            disabled={isAdding || (!isSongPlaceholder && !editTitle.trim())}
            className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
          >
            {isAdding ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
