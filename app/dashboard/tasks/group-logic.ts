import type { Task, TaskPriority } from './types'
import type { GroupByField } from './components/GroupBySelector'

export interface TaskGroup {
  id: string
  label: string
  color?: string | null
  tasks: Task[]
}

// Priority order for sorting groups
const priorityOrder: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const priorityLabels: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const priorityColors: Record<TaskPriority, string> = {
  urgent: '#dc2626', // red-600
  high: '#ea580c', // orange-600
  medium: '#2563eb', // blue-600
  low: '#6b7280', // gray-500
}

export function groupTasks(tasks: Task[], groupBy: GroupByField): TaskGroup[] {
  if (groupBy === 'none') {
    return [{ id: 'all', label: 'All Tasks', tasks }]
  }

  const groups = new Map<string, TaskGroup>()

  tasks.forEach((task) => {
    let groupId: string
    let groupLabel: string
    let groupColor: string | null = null

    switch (groupBy) {
      case 'priority':
        groupId = task.priority
        groupLabel = priorityLabels[task.priority]
        groupColor = priorityColors[task.priority]
        break

      case 'assignee':
        if (task.assignee) {
          groupId = task.assigned_to || 'unassigned'
          groupLabel = `${task.assignee.first_name} ${task.assignee.last_name}`
        } else {
          groupId = 'unassigned'
          groupLabel = 'Unassigned'
        }
        break

      case 'ministry':
        if (task.ministry) {
          groupId = task.ministry_id || 'no-ministry'
          groupLabel = task.ministry.name
          groupColor = task.ministry.color
        } else {
          groupId = 'no-ministry'
          groupLabel = 'No Ministry'
        }
        break

      case 'campus':
        if (task.campus) {
          groupId = task.campus_id || 'no-campus'
          groupLabel = task.campus.name
          groupColor = task.campus.color
        } else {
          groupId = 'no-campus'
          groupLabel = 'No Campus'
        }
        break

      default:
        groupId = 'all'
        groupLabel = 'All Tasks'
    }

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        label: groupLabel,
        color: groupColor,
        tasks: [],
      })
    }

    groups.get(groupId)!.tasks.push(task)
  })

  // Sort groups based on groupBy field
  const sortedGroups = Array.from(groups.values())

  switch (groupBy) {
    case 'priority':
      // Sort by priority order (urgent first, low last)
      sortedGroups.sort((a, b) => {
        const orderA = priorityOrder[a.id as TaskPriority] ?? 999
        const orderB = priorityOrder[b.id as TaskPriority] ?? 999
        return orderA - orderB
      })
      break

    case 'assignee':
    case 'ministry':
    case 'campus':
      // Sort alphabetically, but put "unassigned/no-xxx" at the end
      sortedGroups.sort((a, b) => {
        if (a.id.startsWith('no-') || a.id === 'unassigned') return 1
        if (b.id.startsWith('no-') || b.id === 'unassigned') return -1
        return a.label.localeCompare(b.label)
      })
      break
  }

  return sortedGroups
}
