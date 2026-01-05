import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { createTask, updateTask } from '../actions'
import type {
  Task,
  TaskMinistry,
  TaskPriority,
  TaskStatus,
  TaskFormState,
  TaskFormData,
} from './types'

interface UseTaskDialogStateOptions {
  open: boolean
  task: Task | null
  ministries: TaskMinistry[]
  events: { id: string; title: string; start_time: string }[]
  defaultEventId?: string
  defaultCampusId?: string
  onClose: (success?: boolean) => void
}

// Helper to convert ISO date to YYYY-MM-DD
function toDateString(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  try {
    return format(parseISO(isoDate), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export function useTaskDialogState({
  open,
  task,
  ministries,
  events,
  defaultEventId,
  defaultCampusId,
  onClose,
}: UseTaskDialogStateOptions) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<string>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [eventId, setEventId] = useState<string>('')
  const [ministryId, setMinistryId] = useState<string>('')
  const [campusId, setCampusId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Picker visibility
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [showEventPicker, setShowEventPicker] = useState(false)

  const isEditing = !!task

  // Filter ministries based on selected campus
  const filteredMinistries = useMemo(() => {
    if (!campusId) {
      return ministries
    }
    return ministries.filter((m) => !m.campus_id || m.campus_id === campusId)
  }, [ministries, campusId])

  // Clear ministry selection if it's no longer valid for the selected campus
  useEffect(() => {
    if (ministryId && campusId) {
      const ministry = ministries.find((m) => m.id === ministryId)
      if (ministry?.campus_id && ministry.campus_id !== campusId) {
        setMinistryId('')
      }
    }
  }, [campusId, ministryId, ministries])

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
          const event = events.find((e) => e.id === defaultEventId)
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
      const event = events.find((e) => e.id === eventId)
      if (event) {
        setDueDate(toDateString(event.start_time))
      }
    }
  }, [eventId, events, task])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!title.trim()) {
        toast.error('Title is required')
        return
      }

      setIsLoading(true)

      const data: TaskFormData = {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
        assignedTo: assignedTo || null,
        priority,
        status,
        eventId: eventId || null,
        ministryId: ministryId || null,
        campusId: campusId || null,
      }

      const result = isEditing
        ? await updateTask(task!.id, data)
        : await createTask(data)

      setIsLoading(false)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Task updated' : 'Task created')
        onClose(true)
      }
    },
    [
      title,
      description,
      dueDate,
      assignedTo,
      priority,
      status,
      eventId,
      ministryId,
      campusId,
      isEditing,
      task,
      onClose,
    ]
  )

  return {
    // Form state
    formState: {
      title,
      description,
      dueDate,
      assignedTo,
      priority,
      status,
      eventId,
      ministryId,
      campusId,
    } as TaskFormState,

    // Setters
    setTitle,
    setDescription,
    setDueDate,
    setAssignedTo,
    setPriority,
    setStatus,
    setEventId,
    setMinistryId,
    setCampusId,

    // Derived state
    isEditing,
    isLoading,
    filteredMinistries,

    // Picker state
    showMemberPicker,
    setShowMemberPicker,
    showEventPicker,
    setShowEventPicker,

    // Actions
    handleSubmit,
  }
}
