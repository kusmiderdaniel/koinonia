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
import { addAgendaItem, updateAgendaItem, getMinistriesWithRoles, getMinistryMembersForAgenda } from '../actions'

interface Leader {
  id: string
  first_name: string
  last_name: string
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  leader_id: string | null
  leader: Leader | null
  ministry_id: string | null
  ministry: Ministry | null
  sort_order: number
}

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface AgendaItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  item: AgendaItem | null
  onSuccess: () => void
}

export function AgendaItemDialog({
  open,
  onOpenChange,
  eventId,
  item,
  onSuccess,
}: AgendaItemDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('5')
  const [durationSeconds, setDurationSeconds] = useState('00')
  const [ministryId, setMinistryId] = useState<string>('')
  const [leaderId, setLeaderId] = useState<string>('')
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (item) {
        setTitle(item.title)
        setDescription(item.description || '')
        // Convert seconds to MM:SS
        const totalSeconds = item.duration_seconds
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setDurationMinutes(mins.toString())
        setDurationSeconds(secs.toString().padStart(2, '0'))
        setMinistryId(item.ministry_id || '')
        setLeaderId(item.leader_id || 'none')
      } else {
        setTitle('')
        setDescription('')
        setDurationMinutes('5')
        setDurationSeconds('00')
        setMinistryId('')
        setLeaderId('none')
      }
      setError(null)

      // Load ministries and members for selection
      loadMinistries()
    }
  }, [open, item])

  // Load ministry members when ministry changes
  useEffect(() => {
    if (ministryId) {
      loadMinistryMembers(ministryId)
    } else {
      setMembers([])
    }
  }, [ministryId])

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

  const loadMinistries = async () => {
    const result = await getMinistriesWithRoles()
    if (result.data) {
      setMinistries(result.data)
    }
  }

  const loadMinistryMembers = async (selectedMinistryId: string) => {
    setIsLoadingMembers(true)
    setLeaderId('none') // Reset leader when ministry changes
    const result = await getMinistryMembersForAgenda(selectedMinistryId)
    if (result.data) {
      setMembers(result.data as Member[])
    }
    setIsLoadingMembers(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate ministry is selected for new items
    if (!item && !ministryId) {
      setError('Please select a ministry')
      setIsLoading(false)
      return
    }

    // Convert MM:SS to total seconds
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
      leaderId: leaderId === 'none' ? null : leaderId,
      ministryId: ministryId,
      sortOrder: item?.sort_order ?? 0,
    }

    const result = item
      ? await updateAgendaItem(item.id, data)
      : await addAgendaItem(eventId, data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Agenda Item' : 'Add Agenda Item'}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Update the agenda item details.'
              : 'Add a new item to the event agenda.'}
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
              <Label>Responsible Ministry *</Label>
              <Select value={ministryId} onValueChange={setMinistryId}>
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

            <div className="space-y-2">
              <Label htmlFor="leader">Leader</Label>
              <Select
                value={leaderId}
                onValueChange={setLeaderId}
                disabled={!ministryId}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue placeholder={!ministryId ? "Select ministry first" : isLoadingMembers ? "Loading..." : "Select a leader (optional)"} />
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input max-h-[200px]">
                  <SelectItem value="none">No leader assigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ministryId && members.length === 0 && !isLoadingMembers && (
                <p className="text-xs text-muted-foreground">No members in this ministry yet</p>
              )}
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
              {isLoading ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
