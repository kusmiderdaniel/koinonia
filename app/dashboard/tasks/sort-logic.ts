// Sort logic for tasks

import type { SortState } from './sort-types'
import { countActiveSorts } from '@/lib/filters/sort-types'
import type { Task, TaskPriority, TaskStatus } from './types'

export { countActiveSorts }

const priorityOrder: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const statusOrder: Record<TaskStatus, number> = {
  in_progress: 4,
  pending: 3,
  completed: 2,
  cancelled: 1,
}

export function applySorts(tasks: Task[], sortState: SortState): Task[] {
  if (sortState.length === 0) {
    // Default sort: by due date (soonest first), then by priority
    return [...tasks].sort((a, b) => {
      // Tasks without due dates go to the end
      if (!a.due_date && !b.due_date) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      if (!a.due_date) return 1
      if (!b.due_date) return -1

      const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (dateCompare !== 0) return dateCompare

      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  return [...tasks].sort((a, b) => {
    for (const rule of sortState) {
      const comparison = compareByField(a, b, rule.field)
      if (comparison !== 0) {
        return rule.direction === 'asc' ? comparison : -comparison
      }
    }
    return 0
  })
}

function compareByField(a: Task, b: Task, field: string): number {
  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title)

    case 'due_date':
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()

    case 'priority':
      return priorityOrder[a.priority] - priorityOrder[b.priority]

    case 'status':
      return statusOrder[a.status] - statusOrder[b.status]

    case 'created_at':
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()

    case 'assignee':
      const nameA = a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : ''
      const nameB = b.assignee ? `${b.assignee.first_name} ${b.assignee.last_name}` : ''
      if (!nameA && !nameB) return 0
      if (!nameA) return 1
      if (!nameB) return -1
      return nameA.localeCompare(nameB)

    default:
      return 0
  }
}

