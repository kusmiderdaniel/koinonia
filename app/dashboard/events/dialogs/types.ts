import type { Event, Location, Person } from '../types'
import type { CampusOption } from '@/components/CampusPicker'

export interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  onSuccess: () => void
  timeFormat?: '12h' | '24h'
}

export interface InviteUsersPickerProps {
  invitedUsers: string[]
  setInvitedUsers: (users: string[]) => void
  churchMembers: Person[]
}

export interface EventFormFieldsProps {
  // Title
  title: string
  setTitle: (value: string) => void

  // Event type
  eventType: string
  setEventType: (value: string) => void

  // Visibility
  visibility: string
  setVisibility: (value: string) => void

  // Campus
  campuses: CampusOption[]
  campusesLoading: boolean
  selectedCampusIds: string[]
  onCampusChange: (campusIds: string[]) => void

  // Invite users (for hidden visibility)
  invitedUsers: string[]
  setInvitedUsers: (users: string[]) => void
  churchMembers: Person[]

  // Location
  selectedLocation: Location | null
  setSelectedLocation: (location: Location | null) => void
  locationPickerOpen: boolean
  setLocationPickerOpen: (open: boolean) => void

  // Responsible person
  selectedResponsiblePerson: Person | null
  setSelectedResponsiblePerson: (person: Person | null) => void
  responsiblePersonPickerOpen: boolean
  setResponsiblePersonPickerOpen: (open: boolean) => void

  // Times
  startTime: string
  endTime: string
  onStartTimeChange: (value: string) => void
  setEndTime: (value: string) => void

  // Time format preference
  timeFormat?: '12h' | '24h'

  // Error
  error: string | null
}

export type { Event, Location, Person, CampusOption }
