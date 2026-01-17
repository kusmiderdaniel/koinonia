import { format, parseISO, startOfDay, addDays } from 'date-fns'
import type { DashboardAssignment, DashboardTask } from '@/app/dashboard/actions'
import { getDateTimeFormatPattern, getTimeFormatPattern, type TimeFormat } from '@/lib/utils/format'

export interface PendingMember {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export interface UrgentItem {
  type: 'invitation' | 'task' | 'pending_member'
  id: string
  title: string
  subtitle: string
  dueLabel?: string
  isOverdue?: boolean
  ministry?: {
    name: string
    color: string
  }
  originalData: DashboardAssignment | DashboardTask | PendingMember
}

export interface WeekItem {
  type: 'assignment' | 'task'
  id: string
  title: string
  subtitle: string
  time?: string
  date: Date
  ministry?: {
    name: string
    color: string
  }
  originalData: DashboardAssignment | DashboardTask
}

// Helper function to create urgent items from assignments, tasks, and pending members
export function createUrgentItems(
  assignments: DashboardAssignment[],
  tasks: DashboardTask[],
  timeFormat: TimeFormat = '24h',
  pendingMembers: PendingMember[] = []
): UrgentItem[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const items: UrgentItem[] = []

  // Add pending member registrations (highest priority for leaders)
  pendingMembers.forEach((member) => {
    items.push({
      type: 'pending_member',
      id: member.id,
      title: `${member.first_name} ${member.last_name}`,
      subtitle: member.email,
      originalData: member,
    })
  })

  // Add pending invitations
  assignments
    .filter((a) => a.status === 'invited')
    .forEach((assignment) => {
      items.push({
        type: 'invitation',
        id: assignment.id,
        title: assignment.position.title,
        subtitle: `${assignment.event.title} - ${format(
          new Date(assignment.event.start_time),
          getDateTimeFormatPattern(timeFormat)
        )}`,
        ministry: assignment.ministry,
        originalData: assignment,
      })
    })

  // Add overdue and today's tasks
  tasks.forEach((task) => {
    if (!task.due_date) return

    const dueDate = parseISO(task.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    const isOverdue = dueDateOnly < today
    const isToday = dueDateOnly.getTime() === today.getTime()

    if (isOverdue || isToday) {
      items.push({
        type: 'task',
        id: task.id,
        title: task.title,
        subtitle: task.event ? `Event: ${task.event.title}` : task.ministry?.name || '',
        dueLabel: isOverdue ? 'Overdue' : 'Today',
        isOverdue,
        ministry: task.ministry || undefined,
        originalData: task,
      })
    }
  })

  // Sort: pending_members first, then invitations, then by overdue status
  items.sort((a, b) => {
    const typeOrder = { pending_member: 0, invitation: 1, task: 2 }
    if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type]
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
    return 0
  })

  return items
}

// Helper function to create week items from assignments and tasks
export function createWeekItems(
  assignments: DashboardAssignment[],
  tasks: DashboardTask[],
  timeFormat: TimeFormat = '24h'
): WeekItem[] {
  const now = new Date()
  const today = startOfDay(now)
  const weekEnd = addDays(today, 7)

  const items: WeekItem[] = []

  // Add accepted assignments for the week
  assignments
    .filter((a) => a.status === 'accepted')
    .forEach((assignment) => {
      const eventDate = new Date(assignment.event.start_time)
      const eventDay = startOfDay(eventDate)

      // Include if within next 7 days
      if (eventDay >= today && eventDay < weekEnd) {
        items.push({
          type: 'assignment',
          id: assignment.id,
          title: assignment.position.title,
          subtitle: assignment.event.title,
          time: format(eventDate, getTimeFormatPattern(timeFormat)),
          date: eventDate,
          ministry: assignment.ministry,
          originalData: assignment,
        })
      }
    })

  // Add tasks due this week (not overdue or today - those are urgent)
  tasks.forEach((task) => {
    if (!task.due_date) return

    const dueDate = parseISO(task.due_date)
    const dueDateOnly = startOfDay(dueDate)

    // Only include tasks due after today and within the week
    if (dueDateOnly > today && dueDateOnly < weekEnd) {
      items.push({
        type: 'task',
        id: task.id,
        title: task.title,
        subtitle: task.event ? `Event: ${task.event.title}` : task.ministry?.name || '',
        date: dueDate,
        ministry: task.ministry || undefined,
        originalData: task,
      })
    }
  })

  // Sort by date
  items.sort((a, b) => a.date.getTime() - b.date.getTime())

  return items
}
