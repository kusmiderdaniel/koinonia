// Ministries module types
import type { Campus, Person } from '@/lib/types'

// Re-export shared types
export type { Campus }
export type MinistryCampus = Campus

// Full ministry with all details
export interface Ministry {
  id: string
  name: string
  description: string | null
  color: string
  leader_id: string | null
  campus_id: string | null
  is_active: boolean
  is_system: boolean
  created_at: string
  leader: Person | null
  campus: MinistryCampus | null
}

// Ministry role definition
export interface Role {
  id: string
  ministry_id: string
  name: string
  description: string | null
  sort_order: number
}

// Ministry member with profile and roles
export interface MinistryMember {
  id: string
  ministry_id: string
  profile_id: string
  profile: Person
  roles: {
    id: string
    name: string
  }[]
}

// Church member for selection dialogs
export interface ChurchMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
}

// Brief ministry info with members
export interface MinistryInfo {
  id: string
  name: string
  members: {
    profile_id: string
    role_names: string[]
  }[]
}
