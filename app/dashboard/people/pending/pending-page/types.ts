export interface CampusInfo {
  id: string
  name: string
  color: string
}

export interface PendingRegistration {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  status: string
  created_at: string
  campus_id: string | null
  campus: CampusInfo | null
}

export interface OfflineMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  date_of_birth: string | null
}
