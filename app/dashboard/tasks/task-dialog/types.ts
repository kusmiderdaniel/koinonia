import type { Task, TaskMinistry, TaskCampus, Person, TaskPriority, TaskStatus } from '../types'

export type { Task, TaskMinistry, TaskCampus, Person, TaskPriority, TaskStatus }

export interface TaskDialogProps {
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

export interface TaskFormState {
  title: string
  description: string
  dueDate: string
  assignedTo: string
  priority: TaskPriority
  status: TaskStatus
  eventId: string
  ministryId: string
  campusId: string
}

export interface TaskFormData {
  title: string
  description: string | null
  dueDate: string | null
  assignedTo: string | null
  priority: TaskPriority
  status: TaskStatus
  eventId: string | null
  ministryId: string | null
  campusId: string | null
}
