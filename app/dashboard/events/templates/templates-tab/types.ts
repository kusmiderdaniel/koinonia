export interface Location {
  id: string
  name: string
  address: string | null
}

export interface Person {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface Campus {
  id: string
  name: string
  color: string
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
  campus: Campus | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
  agendaItemCount: number
  positionCount: number
}

export interface TemplateDetail {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  campus_id: string | null
  campus: Campus | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
  event_template_agenda_items: Array<{
    id: string
    title: string
    description: string | null
    duration_seconds: number
    is_song_placeholder: boolean
    ministry_id: string | null
    ministry: { id: string; name: string } | null
    sort_order: number
  }>
  event_template_positions: Array<{
    id: string
    ministry_id: string
    role_id: string | null
    title: string
    quantity_needed: number
    notes: string | null
    ministry: { id: string; name: string; color: string } | null
    role: { id: string; name: string } | null
    sort_order: number | null
  }>
}
