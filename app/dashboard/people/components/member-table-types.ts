export type Role = 'owner' | 'admin' | 'leader' | 'volunteer' | 'member'
export type AssignableRole = 'admin' | 'leader' | 'volunteer' | 'member'

export interface MinistryRole {
  id: string
  name: string
}

export interface Ministry {
  id: string
  name: string
  color: string
}

export interface MinistryMember {
  id: string
  role: MinistryRole | MinistryRole[] | null
  ministry: Ministry | Ministry[] | null
}

export interface Campus {
  id: string
  name: string
  color: string
  is_primary: boolean
}

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
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
  ministry_members: MinistryMember[]
  campuses: Campus[]
}

export const roleHierarchy: Record<Role, number> = {
  owner: 5,
  admin: 4,
  leader: 3,
  volunteer: 2,
  member: 1,
}

// Roles that can be assigned from People table (excludes owner)
export const assignableRoles: AssignableRole[] = ['admin', 'leader', 'volunteer', 'member']

// Pill-style colors for roles
export const roleColors: Record<Role, { bg: string; text: string; border: string; hoverBg: string }> = {
  owner: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hoverBg: 'hover:bg-purple-100' },
  admin: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', hoverBg: 'hover:bg-red-100' },
  leader: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hoverBg: 'hover:bg-blue-100' },
  volunteer: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hoverBg: 'hover:bg-green-100' },
  member: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', hoverBg: 'hover:bg-gray-100' },
}

export function getRoleBadgeClasses(role: string): string {
  const colors = roleColors[role as Role] || roleColors.member
  return `inline-flex items-center ${colors.bg} ${colors.text} ${colors.border} border rounded-full px-2.5 py-1 text-xs font-medium`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateOfBirth(dateString: string | null): string {
  if (!dateString) return '—'
  return formatDate(dateString)
}

export function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—'
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age.toString()
}
