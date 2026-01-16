import { FilterRule, FilterGroup, FilterState, FILTER_FIELDS } from './filter-types'
import { type Member } from './components/member-table-types'
import {
  evaluateTextRule,
  evaluateSelectRule,
  evaluateBooleanRule,
  evaluateDateRule,
  evaluateNumberRule,
  evaluateMultiSelectRule,
  inferTypeFromValue,
} from '@/lib/filters'

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
  // Handle custom fields (prefixed with cf_)
  if (fieldId.startsWith('cf_')) {
    const customFieldId = fieldId.slice(3) // Remove 'cf_' prefix
    const value = member.custom_field_values?.[customFieldId]
    if (value === undefined) return null
    return value as string | boolean | number | null | string[]
  }

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

  // For custom fields, infer type from value or use select/text based on operator
  let fieldType: string
  if (rule.field.startsWith('cf_')) {
    // Infer type from value or from operator hints
    if (rule.operator === 'is' || rule.operator === 'is_not') {
      // Could be select or boolean
      if (typeof fieldValue === 'boolean') {
        fieldType = 'boolean'
      } else {
        fieldType = 'select'
      }
    } else {
      fieldType = inferTypeFromValue(fieldValue)
    }
  } else {
    const field = FILTER_FIELDS.find(f => f.id === rule.field)
    if (!field) return true
    fieldType = field.type
  }

  switch (fieldType) {
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
