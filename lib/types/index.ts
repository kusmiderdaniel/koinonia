// Shared types used across the application

export interface Location {
  id: string
  name: string
  address: string | null
  notes?: string | null
}

export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface PersonBrief {
  id: string
  first_name: string
  last_name: string
}

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role?: string
}
