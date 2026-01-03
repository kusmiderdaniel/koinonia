'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { DatePicker } from '@/components/ui/date-picker'
import { format, parseISO } from 'date-fns'
import { User, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { createTask, updateTask } from './actions'
import { MemberPicker } from './components/MemberPicker'
import { EventPicker } from './components/EventPicker'
import type { Task, TaskMinistry, TaskCampus, Person, TaskPriority, TaskStatus } from './types'

interface TaskDialogProps {
  open: boolean
  onClose: (success?: boolean) => void
  task: Task | null
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  events: { id: string; title: string; start_time: string }[]
  defaultEventId?: string
  defaultCampusId?: string
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function TaskDialog({
  open,
  onClose,
  task,
  ministries,
  campuses,
  members,
  events,
  defaultEventId,
  defaultCampusId,
  weekStartsOn = 0,
}: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<string>('') // YYYY-MM-DD format
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [eventId, setEventId] = useState<string>('')
  const [ministryId, setMinistryId] = useState<string>('')
  const [campusId, setCampusId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [showEventPicker, setShowEventPicker] = useState(false)

  const isEditing = !!task

  // Filter ministries based on selected campus
  const filteredMinistries = useMemo(() => {
    if (!campusId) {
      // No campus selected - show all ministries
      return ministries
    }
    // Show ministries that belong to the selected campus OR have no campus (church-wide)
    return ministries.filter(m => !m.campus_id || m.campus_id === campusId)
  }, [ministries, campusId])

  // Clear ministry selection if it's no longer valid for the selected campus
  useEffect(() => {
    if (ministryId && campusId) {
      const ministry = ministries.find(m => m.id === ministryId)
      if (ministry?.campus_id && ministry.campus_id !== campusId) {
        setMinistryId('')
      }
    }
  }, [campusId, ministryId, ministries])

  // Helper to convert ISO date to YYYY-MM-DD
  const toDateString = (isoDate: string | null | undefined): string => {
    if (!isoDate) return ''
    try {
      return format(parseISO(isoDate), 'yyyy-MM-dd')
    } catch {
      return ''
    }
  }

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title)
        setDescription(task.description || '')
        setDueDate(toDateString(task.due_date))
        setAssignedTo(task.assigned_to || '')
        setPriority(task.priority)
        setStatus(task.status)
        setEventId(task.event_id || '')
        setMinistryId(task.ministry_id || '')
        setCampusId(task.campus_id || '')
      } else {
        setTitle('')
        setDescription('')
        setDueDate('')
        setAssignedTo('')
        setPriority('medium')
        setStatus('pending')
        setEventId(defaultEventId || '')
        setMinistryId('')
        setCampusId(defaultCampusId || '')

        // If event is pre-selected, set due date from event
        if (defaultEventId) {
          const event = events.find(e => e.id === defaultEventId)
          if (event) {
            setDueDate(toDateString(event.start_time))
          }
        }
      }
    }
  }, [open, task, defaultEventId, defaultCampusId, events])

  // Update due date when event changes
  useEffect(() => {
    if (eventId && !task) {
      const event = events.find(e => e.id === eventId)
      if (event) {
        setDueDate(toDateString(event.start_time))
      }
    }
  }, [eventId, events, task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsLoading(true)

    const data = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null, // Convert YYYY-MM-DD to ISO
      assignedTo: assignedTo || null,
      priority,
      status,
      eventId: eventId || null,
      ministryId: ministryId || null,
      campusId: campusId || null,
    }

    const result = isEditing
      ? await updateTask(task.id, data)
      : await createTask(data)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditing ? 'Task updated' : 'Task created')
      onClose(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the task details below.' : 'Add a new task to your list.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                autoFocus
              />
            </div>

            {/* Status (only show when editing) */}
            {isEditing && (
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectItem value="pending" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">Pending</SelectItem>
                    <SelectItem value="in_progress" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">In Progress</SelectItem>
                    <SelectItem value="completed" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">Completed</SelectItem>
                    <SelectItem value="cancelled" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Row 1: Campus & Ministry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Campus</Label>
                <Select value={campusId || '_none'} onValueChange={(v) => setCampusId(v === '_none' ? '' : v)}>
                  <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectItem value="_none" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">None</SelectItem>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.id} value={campus.id} className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                        <span className="flex items-center gap-2">
                          {campus.color && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: campus.color }}
                            />
                          )}
                          {campus.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ministry</Label>
                <Select value={ministryId || '_none'} onValueChange={(v) => setMinistryId(v === '_none' ? '' : v)}>
                  <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectItem value="_none" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">None</SelectItem>
                    {filteredMinistries.map((ministry) => (
                      <SelectItem key={ministry.id} value={ministry.id} className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ministry.color }}
                          />
                          {ministry.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Due Date & Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Pick a date"
                  weekStartsOn={weekStartsOn}
                />
              </div>
              <div className="grid gap-2">
                <Label>Assign To</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center bg-white dark:bg-zinc-950 !border !border-black dark:!border-white font-normal h-10"
                  onClick={() => setShowMemberPicker(true)}
                >
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  {(() => {
                    const selectedMember = assignedTo ? members.find(m => m.id === assignedTo) : null
                    return selectedMember
                      ? `${selectedMember.first_name} ${selectedMember.last_name}`
                      : <span className="text-muted-foreground">Select a person</span>
                  })()}
                </Button>
                <MemberPicker
                  open={showMemberPicker}
                  onOpenChange={setShowMemberPicker}
                  members={members}
                  currentAssigneeId={assignedTo || null}
                  onSelect={(id) => setAssignedTo(id || '')}
                />
              </div>
            </div>

            {/* Row 3: Link to Event & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Link to Event</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center bg-white dark:bg-zinc-950 !border !border-black dark:!border-white font-normal h-10"
                  onClick={() => setShowEventPicker(true)}
                >
                  <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                  {(() => {
                    const selectedEvent = eventId ? events.find(e => e.id === eventId) : null
                    return selectedEvent
                      ? <span className="truncate">{selectedEvent.title}</span>
                      : <span className="text-muted-foreground">None</span>
                  })()}
                </Button>
                <EventPicker
                  open={showEventPicker}
                  onOpenChange={setShowEventPicker}
                  currentEventId={eventId || null}
                  onSelect={(id) => setEventId(id || '')}
                  weekStartsOn={weekStartsOn}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
                    <SelectItem value="low" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="urgent" className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about the task..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4 !bg-transparent !border-0 !mx-0 !mb-0 !p-0">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
