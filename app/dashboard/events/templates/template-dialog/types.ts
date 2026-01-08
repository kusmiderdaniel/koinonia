export interface Location {
  id: string
  name: string
  address: string | null
  campus_id?: string | null
}

export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface Campus {
  id: string
  name: string
  color: string
  is_default: boolean
}

export interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  campus_id: string | null
  campus: { id: string; name: string; color: string } | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
}

export interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
  onSuccess: () => void
  timeFormat?: '12h' | '24h'
}

export interface TemplateFormData {
  name: string
  description: string
  eventType: string
  selectedLocation: Location | null
  selectedResponsiblePerson: Person | null
  campusId: string | null
  defaultStartTime: string
  defaultDurationMinutes: number
  visibility: string
}

export const EVENT_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'special_event', label: 'Special Event' },
  { value: 'other', label: 'Other' },
] as const

export const VISIBILITY_LEVELS = [
  { value: 'members', label: 'All Members', description: 'Visible to all church members' },
  { value: 'volunteers', label: 'Volunteers+', description: 'Visible to volunteers, leaders, and admins' },
  { value: 'leaders', label: 'Leaders+', description: 'Visible to leaders and admins only' },
  { value: 'hidden', label: 'Private', description: 'Only visible to invited users' },
] as const

export const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
] as const

export function parseTime(timeString: string): string {
  return timeString.substring(0, 5)
}
