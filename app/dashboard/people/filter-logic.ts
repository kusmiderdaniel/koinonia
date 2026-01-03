import { FilterRule, FilterGroup, FilterState, FILTER_FIELDS } from './filter-types'
import { type Member } from './components/member-table-types'

// Calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Get field value from member
function getFieldValue(member: Member, fieldId: string): string | boolean | number | null | string[] {
  switch (fieldId) {
    case 'name':
      return `${member.first_name} ${member.last_name}`
    case 'email':
      return member.email
    case 'role':
      return member.role
    case 'active':
      return member.active
    case 'sex':
      return member.sex
    case 'date_of_birth':
      return member.date_of_birth
    case 'age':
      return calculateAge(member.date_of_birth)
    case 'baptism':
      return member.baptism
    case 'baptism_date':
      return member.baptism_date
    case 'date_of_departure':
      return member.date_of_departure
    case 'created_at':
      return member.created_at
    case 'ministry_roles':
      // Get all ministry role names
      return member.ministry_members
        .filter(mm => {
          const role = Array.isArray(mm.role) ? mm.role[0] : mm.role
          return role !== null
        })
        .map(mm => {
          const role = Array.isArray(mm.role) ? mm.role[0] : mm.role
          return role?.name || ''
        })
        .filter(Boolean)
    default:
      return null
  }
}

// Evaluate a single rule against a member
function evaluateRule(member: Member, rule: FilterRule): boolean {
  const fieldValue = getFieldValue(member, rule.field)
  const field = FILTER_FIELDS.find(f => f.id === rule.field)

  if (!field) return true

  switch (field.type) {
    case 'text':
      return evaluateTextRule(fieldValue as string | null, rule.operator, rule.value as string)
    case 'select':
      return evaluateSelectRule(fieldValue as string | null, rule.operator, rule.value as string)
    case 'boolean':
      return evaluateBooleanRule(fieldValue as boolean, rule.operator, rule.value as boolean)
    case 'date':
      return evaluateDateRule(fieldValue as string | null, rule.operator, rule.value as string)
    case 'number':
      return evaluateNumberRule(fieldValue as number | null, rule.operator, rule.value as string)
    case 'multiSelect':
      return evaluateMultiSelectRule(fieldValue as string[], rule.operator, rule.value as string)
    default:
      return true
  }
}

function evaluateTextRule(value: string | null, operator: string, filterValue: string): boolean {
  const normalizedValue = (value || '').toLowerCase()
  const normalizedFilter = (filterValue || '').toLowerCase()

  switch (operator) {
    case 'contains':
      return normalizedValue.includes(normalizedFilter)
    case 'not_contains':
      return !normalizedValue.includes(normalizedFilter)
    case 'equals':
      return normalizedValue === normalizedFilter
    case 'not_equals':
      return normalizedValue !== normalizedFilter
    case 'starts_with':
      return normalizedValue.startsWith(normalizedFilter)
    case 'ends_with':
      return normalizedValue.endsWith(normalizedFilter)
    case 'is_empty':
      return !value || value.trim() === ''
    case 'is_not_empty':
      return !!value && value.trim() !== ''
    default:
      return true
  }
}

function evaluateSelectRule(value: string | null, operator: string, filterValue: string): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue
    case 'is_not':
      return value !== filterValue
    case 'is_empty':
      return !value
    case 'is_not_empty':
      return !!value
    default:
      return true
  }
}

function evaluateBooleanRule(value: boolean, operator: string, filterValue: boolean): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue
    default:
      return true
  }
}

function evaluateDateRule(value: string | null, operator: string, filterValue: string): boolean {
  switch (operator) {
    case 'is_empty':
      return !value
    case 'is_not_empty':
      return !!value
    case 'is':
      if (!value || !filterValue) return false
      return new Date(value).toDateString() === new Date(filterValue).toDateString()
    case 'is_before':
      if (!value || !filterValue) return false
      return new Date(value) < new Date(filterValue)
    case 'is_after':
      if (!value || !filterValue) return false
      return new Date(value) > new Date(filterValue)
    default:
      return true
  }
}

function evaluateNumberRule(value: number | null, operator: string, filterValue: string): boolean {
  const numFilter = parseFloat(filterValue)

  switch (operator) {
    case 'is_empty':
      return value === null
    case 'is_not_empty':
      return value !== null
    case 'eq':
      return value === numFilter
    case 'neq':
      return value !== numFilter
    case 'lt':
      return value !== null && value < numFilter
    case 'gt':
      return value !== null && value > numFilter
    case 'lte':
      return value !== null && value <= numFilter
    case 'gte':
      return value !== null && value >= numFilter
    default:
      return true
  }
}

function evaluateMultiSelectRule(values: string[], operator: string, filterValue: string): boolean {
  const normalizedValues = values.map(v => v.toLowerCase())
  const normalizedFilter = (filterValue || '').toLowerCase()

  switch (operator) {
    case 'contains':
      return normalizedValues.some(v => v.includes(normalizedFilter))
    case 'not_contains':
      return !normalizedValues.some(v => v.includes(normalizedFilter))
    case 'is_empty':
      return values.length === 0
    case 'is_not_empty':
      return values.length > 0
    default:
      return true
  }
}

// Evaluate a filter group
function evaluateGroup(member: Member, group: FilterGroup): boolean {
  const ruleResults = group.rules.map(rule => evaluateRule(member, rule))
  const groupResults = (group.groups ?? []).map(g => evaluateGroup(member, g))
  const allResults = [...ruleResults, ...groupResults]

  if (allResults.length === 0) return true

  if (group.conjunction === 'and') {
    return allResults.every(Boolean)
  } else {
    return allResults.some(Boolean)
  }
}

// Main filter function
export function applyFilters(members: Member[], filterState: FilterState): Member[] {
  // If no filters, return all members
  if (filterState.rules.length === 0 && filterState.groups.length === 0) {
    return members
  }

  return members.filter(member => {
    const ruleResults = filterState.rules.map(rule => evaluateRule(member, rule))
    const groupResults = filterState.groups.map(group => evaluateGroup(member, group))
    const allResults = [...ruleResults, ...groupResults]

    if (allResults.length === 0) return true

    if (filterState.conjunction === 'and') {
      return allResults.every(Boolean)
    } else {
      return allResults.some(Boolean)
    }
  })
}

// Count active filters
export function countActiveFilters(filterState: FilterState): number {
  let count = filterState.rules.length

  function countGroupFilters(group: FilterGroup): number {
    return group.rules.length + (group.groups ?? []).reduce((sum, g) => sum + countGroupFilters(g), 0)
  }

  count += filterState.groups.reduce((sum, g) => sum + countGroupFilters(g), 0)
  return count
}
