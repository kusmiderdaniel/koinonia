// Filter logic for tasks

import type { FilterState, FilterRule, FilterGroup } from './filter-types'
import type { Task } from './types'

export function applyFilters(tasks: Task[], filterState: FilterState): Task[] {
  const { conjunction, rules, groups } = filterState

  // If no filters, return all tasks
  if (rules.length === 0 && groups.length === 0) {
    return tasks
  }

  return tasks.filter(task => {
    const ruleResults = rules.map(rule => evaluateRule(task, rule))
    const groupResults = groups.map(group => evaluateGroup(task, group))
    const allResults = [...ruleResults, ...groupResults]

    if (allResults.length === 0) return true

    return conjunction === 'and'
      ? allResults.every(r => r)
      : allResults.some(r => r)
  })
}

function evaluateGroup(task: Task, group: FilterGroup): boolean {
  if (group.rules.length === 0) return true

  const results = group.rules.map(rule => evaluateRule(task, rule))

  return group.conjunction === 'and'
    ? results.every(r => r)
    : results.some(r => r)
}

function evaluateRule(task: Task, rule: FilterRule): boolean {
  const { field, operator, value } = rule
  const fieldValue = getFieldValue(task, field)

  switch (operator) {
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === ''

    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''

    case 'equals':
      if (field === 'due_date') {
        if (!fieldValue || !value) return false
        return new Date(fieldValue as string).toDateString() === new Date(value as string).toDateString()
      }
      return String(fieldValue).toLowerCase() === String(value).toLowerCase()

    case 'not_equals':
      if (field === 'due_date') {
        if (!fieldValue && !value) return false
        if (!fieldValue || !value) return true
        return new Date(fieldValue as string).toDateString() !== new Date(value as string).toDateString()
      }
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase()

    case 'contains':
      if (typeof fieldValue !== 'string') return false
      return fieldValue.toLowerCase().includes(String(value).toLowerCase())

    case 'not_contains':
      if (typeof fieldValue !== 'string') return true
      return !fieldValue.toLowerCase().includes(String(value).toLowerCase())

    case 'before':
      if (!fieldValue || !value) return false
      return new Date(fieldValue as string) < new Date(value as string)

    case 'after':
      if (!fieldValue || !value) return false
      return new Date(fieldValue as string) > new Date(value as string)

    default:
      return true
  }
}

function getFieldValue(task: Task, field: string): string | boolean | null {
  switch (field) {
    case 'title':
      return task.title
    case 'status':
      return task.status
    case 'priority':
      return task.priority
    case 'due_date':
      return task.due_date
    case 'assignee_id':
      return task.assigned_to
    case 'ministry_id':
      return task.ministry_id
    case 'campus_id':
      return task.campus_id
    case 'event_id':
      return task.event_id
    default:
      return null
  }
}

export function countActiveFilters(filterState: FilterState): number {
  const ruleCount = filterState.rules.length
  const groupRuleCount = filterState.groups.reduce(
    (sum, group) => sum + group.rules.length,
    0
  )
  return ruleCount + groupRuleCount
}
