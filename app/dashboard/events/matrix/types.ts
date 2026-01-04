// Matrix filter state
export interface MatrixFilters {
  campusId: string | null
  ministryIds: string[]
  eventType: string | null
}

// Event data for the matrix view
export interface MatrixEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  event_type: string
  campuses: { id: string; name: string; color: string }[]
  agendaItems: MatrixAgendaItem[]
  positionsByMinistry: MatrixMinistryGroup[]
}

// Agenda item in the matrix (songs and other items)
export interface MatrixAgendaItem {
  agendaItemId: string
  title: string
  description: string | null
  isSong: boolean
  songId: string | null
  songTitle: string | null
  songKey: string | null
  isPlaceholder: boolean
  leaderId: string | null
  leaderFirstName: string | null
  leaderLastName: string | null
  ministryId: string | null
  ministryName: string | null
  ministryColor: string | null
}

// Ministry group with its positions
export interface MatrixMinistryGroup {
  ministryId: string
  ministryName: string
  ministryColor: string
  positions: MatrixPosition[]
}

// Position with assignment
export interface MatrixPosition {
  positionId: string
  title: string
  assignment: MatrixAssignment | null
}

// Assignment data
export interface MatrixAssignment {
  assignmentId: string
  profileId: string
  firstName: string
  lastName: string
  status: string | null
}

// Row definition for rendering
export interface MatrixRow {
  type: 'agenda-header' | 'agenda-item' | 'ministry-header' | 'position' | 'availability-header'
  key: string
  label: string
  agendaIndex?: number
  isSong?: boolean
  ministryId?: string
  ministryColor?: string
  positionTitle?: string
}

// Unavailability for a profile on a date
export interface MatrixUnavailability {
  profileId: string
  firstName: string
  lastName: string
  reason: string | null
}

// Multi-assignment within same event
export interface MatrixMultiAssignment {
  profileId: string
  firstName: string
  lastName: string
  positions: string[]
}

// Complete matrix data structure
export interface MatrixData {
  events: MatrixEvent[]
  rows: MatrixRow[]
  unavailabilityByEvent: Record<string, MatrixUnavailability[]>
  multiAssignmentsByEvent: Record<string, MatrixMultiAssignment[]>
}

// Ministry for filter dropdown
export interface MatrixMinistry {
  id: string
  name: string
  color: string
}

// Campus for filter dropdown
export interface MatrixCampus {
  id: string
  name: string
  color: string
}
