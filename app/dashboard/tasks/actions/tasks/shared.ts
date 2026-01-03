// Shared constants and helpers for task actions

export const TASK_SELECT = `
  *,
  assignee:profiles!assigned_to (
    id,
    first_name,
    last_name,
    email
  ),
  event:events!event_id (
    id,
    title,
    start_time,
    end_time
  ),
  ministry:ministries!ministry_id (
    id,
    name,
    color
  ),
  campus:campuses!campus_id (
    id,
    name,
    color
  ),
  created_by_profile:profiles!created_by (
    id,
    first_name,
    last_name
  ),
  completed_by_profile:profiles!completed_by (
    id,
    first_name,
    last_name
  )
`

export function getActivityMessage(type: string, oldValue?: string, newValue?: string): string {
  switch (type) {
    case 'created':
      return 'Task created'
    case 'completed':
      return 'Task marked as completed'
    case 'reopened':
      return 'Task reopened'
    case 'assigned':
      return newValue === 'Unassigned'
        ? 'Assignee removed'
        : 'Task assigned'
    case 'status_changed':
      return `Status changed from ${oldValue} to ${newValue}`
    case 'priority_changed':
      return `Priority changed from ${oldValue} to ${newValue}`
    case 'due_date_changed':
      return `Due date changed`
    default:
      return 'Task updated'
  }
}
