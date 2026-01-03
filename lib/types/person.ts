// Person-related types shared across the application

/**
 * Full person information with email
 */
export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

/**
 * Brief person info for display (no email)
 */
export interface PersonBrief {
  id: string
  first_name: string
  last_name: string
}

/**
 * Church member with role information
 */
export interface Member extends Person {
  role?: string
}

/**
 * Full member information for the people management view
 */
export interface MemberFull extends Person {
  role: string
  active: boolean
  date_of_birth: string | null
  sex: string | null
  date_of_departure: string | null
  reason_for_departure: string | null
  baptism: boolean
  baptism_date: string | null
  member_type: string
  created_at: string
}

/**
 * Get person's full name
 */
export function getFullName(person: PersonBrief | Person): string {
  return `${person.first_name} ${person.last_name}`
}

/**
 * Get person's initials
 */
export function getInitials(person: PersonBrief | Person): string {
  return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase()
}
