import type { SortState } from './sort-types'
import { countActiveSorts } from '@/lib/filters/sort-types'
import { type Member } from './components/member-table-types'

export { countActiveSorts }

// Role hierarchy for sorting
const roleOrder: Record<string, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
}

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

// Get sortable value from member
function getSortValue(member: Member, fieldId: string): string | number | boolean | null {
  switch (fieldId) {
    case 'name':
      return `${member.first_name} ${member.last_name}`.toLowerCase()
    case 'email':
      return member.email?.toLowerCase() || ''
    case 'role':
      return roleOrder[member.role] || 0
    case 'active':
      return member.active ? 1 : 0
    case 'sex':
      return member.sex?.toLowerCase() || ''
    case 'date_of_birth':
      return member.date_of_birth ? new Date(member.date_of_birth).getTime() : null
    case 'age':
      return calculateAge(member.date_of_birth)
    case 'baptism':
      return member.baptism ? 1 : 0
    case 'baptism_date':
      return member.baptism_date ? new Date(member.baptism_date).getTime() : null
    case 'date_of_departure':
      return member.date_of_departure ? new Date(member.date_of_departure).getTime() : null
    case 'created_at':
      return new Date(member.created_at).getTime()
    default:
      return null
  }
}

// Compare two values
function compareValues(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  direction: 'asc' | 'desc'
): number {
  // Handle nulls - null values go to the end
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1

  let result: number

  if (typeof a === 'string' && typeof b === 'string') {
    result = a.localeCompare(b)
  } else if (typeof a === 'number' && typeof b === 'number') {
    result = a - b
  } else if (typeof a === 'boolean' && typeof b === 'boolean') {
    result = (a ? 1 : 0) - (b ? 1 : 0)
  } else {
    result = 0
  }

  return direction === 'desc' ? -result : result
}

// Main sort function - applies multiple sort rules in order
export function applySorts(members: Member[], sortState: SortState): Member[] {
  if (sortState.length === 0) {
    return members
  }

  return [...members].sort((a, b) => {
    for (const rule of sortState) {
      const aValue = getSortValue(a, rule.field)
      const bValue = getSortValue(b, rule.field)
      const comparison = compareValues(aValue, bValue, rule.direction)

      if (comparison !== 0) {
        return comparison
      }
    }
    return 0
  })
}

