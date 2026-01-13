// Common utility types and shared interfaces

import type { Campus } from './entities'

/**
 * Location with optional campus associations (many-to-many)
 */
export interface Location {
  id: string
  name: string
  address: string | null
  notes?: string | null
  campuses?: Campus[]
}

/**
 * Base entity with ID (for generic components)
 */
export interface BaseEntity {
  id: string
}

/**
 * Entity with name (for generic pickers/selectors)
 */
export interface NamedEntity extends BaseEntity {
  name: string
}

/**
 * Entity with color (for badges)
 */
export interface ColoredEntity extends NamedEntity {
  color: string
}

/**
 * Song reference (used in events and song bank)
 */
export interface SongBrief {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
}

/**
 * Tag for categorization
 */
export interface Tag {
  id: string
  name: string
  color: string
}

/**
 * Date formatting utilities
 */
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

export function calculateAge(dateOfBirth: string | null): number | null {
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

export function formatAge(dateOfBirth: string | null): string {
  const age = calculateAge(dateOfBirth)
  return age !== null ? age.toString() : '—'
}
