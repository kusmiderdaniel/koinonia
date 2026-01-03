import type { Task, TaskComment, TaskStatus, TaskPriority, Person, TaskMinistry, TaskCampus } from '@/app/dashboard/tasks/types'

export type { Task, TaskComment, TaskStatus, TaskPriority, Person, TaskMinistry, TaskCampus }

export interface TaskEvent {
  id: string
  title: string
  start_time: string
}

export interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
  onDelete?: () => void
  // Optional - if provided, enables full editing
  members?: Person[]
  ministries?: TaskMinistry[]
  campuses?: TaskCampus[]
  events?: TaskEvent[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  // Control which features are available
  canDelete?: boolean
}

export interface TaskHandlers {
  handleStatusChange: (status: TaskStatus) => Promise<void>
  handlePriorityChange: (priority: TaskPriority) => Promise<void>
  handleAssigneeChange: (assigneeId: string | null) => Promise<void>
  handleDueDateChange: (dueDate: Date | undefined) => Promise<void>
  handleMinistryChange: (ministryId: string | null) => Promise<void>
  handleCampusChange: (campusId: string | null) => Promise<void>
  handleEventChange: (eventId: string | null) => Promise<void>
  handleDescriptionBlur: () => Promise<void>
  handleTitleChange: (title: string) => Promise<void>
}
