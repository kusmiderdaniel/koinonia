// Shared types for the ministries module

export interface Ministry {
  id: string
  name: string
  description: string | null
  color: string
  leader_id: string | null
  is_active: boolean
  is_system: boolean
  created_at: string
  leader: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  } | null
}

export interface Role {
  id: string
  ministry_id: string
  name: string
  description: string | null
  sort_order: number
}

export interface MinistryMember {
  id: string
  ministry_id: string
  profile_id: string
  profile: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  }
  roles: {
    id: string
    name: string
  }[]
}

export interface ChurchMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
}

export interface MinistryInfo {
  id: string
  name: string
  members: {
    profile_id: string
    role_names: string[]
  }[]
}
