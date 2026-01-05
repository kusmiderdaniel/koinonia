// Tasks module types
import type { Person, PersonBrief, MinistryWithCampus, Campus } from '@/lib/types'
import type { TaskStatus, TaskPriority, TaskActivityType } from '@/lib/validations/tasks'

// Re-export shared types
export type { Person, PersonBrief }
export type { TaskStatus, TaskPriority, TaskActivityType }

// Task-specific ministry (with optional campus)
export type TaskMinistry = MinistryWithCampus

// Task-specific campus (color can be null)
export interface TaskCampus {
  id: string
  name: string
  color: string | null
  is_default?: boolean | null
}

// Brief event reference
export interface TaskEvent {
  id: string
  title: string
  start_time: string
  end_time: string
}

// Full task entity
export interface Task {
  id: string
  church_id: string
  title: string
  description: string | null
  due_date: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: TaskPriority
  event_id: string | null
  ministry_id: string | null
  campus_id: string | null
  created_by: string | null
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  assignee?: Person | null
  event?: TaskEvent | null
  ministry?: TaskMinistry | null
  campus?: TaskCampus | null
  created_by_profile?: PersonBrief | null
  completed_by_profile?: PersonBrief | null
}

// Task comment/activity
export interface TaskComment {
  id: string
  task_id: string
  content: string
  activity_type: TaskActivityType
  old_value: string | null
  new_value: string | null
  author_id: string
  created_at: string
  author?: Person
}

// Lightweight task for list views
export interface TaskListItem {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  assignee?: PersonBrief | null
  event?: { id: string; title: string } | null
  ministry?: { id: string; name: string; color: string } | null
  campus?: { id: string; name: string; color: string | null } | null
  created_at: string
}
