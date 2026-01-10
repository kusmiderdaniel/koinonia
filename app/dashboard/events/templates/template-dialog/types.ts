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

// Event type values - labels are in translation files
export const EVENT_TYPE_VALUES = ['service', 'rehearsal', 'meeting', 'special_event', 'other'] as const

// Visibility level values - labels are in translation files
export const VISIBILITY_VALUES = ['members', 'volunteers', 'leaders', 'hidden'] as const

// Duration values in minutes - labels are in translation files
export const DURATION_VALUES = [30, 60, 90, 120, 150, 180, 240] as const

export function parseTime(timeString: string): string {
  return timeString.substring(0, 5)
}
