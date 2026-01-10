import type { SavedView } from '@/types/saved-views'
import type { FilterState } from '../filter-types'
import type { SortState } from '../sort-types'
import {
  type Member,
  type AssignableRole,
} from '../components/member-table-types'

export type { Member, AssignableRole }
export type { FilterState, SortState, SavedView }

export interface AvailableCampus {
  id: string
  name: string
  color: string
  is_default: boolean
}

export interface MembersTableProps {
  members: Member[]
  currentUserId: string
  currentUserRole: string
  savedViews: SavedView[]
  canManageViews: boolean
  allCampuses: AvailableCampus[]
}

export interface MemberUpdateState {
  updatingId: string | null
  updatingActiveId: string | null
  updatingDepartureId: string | null
  updatingBaptismId: string | null
  updatingCampusesId: string | null
}

export interface MemberRowProps {
  member: Member
  currentUserId: string
  canEditRole: boolean
  canEditActiveStatus: boolean
  canEditDeparture: boolean
  canEditFields: boolean
  isUpdatingRole: boolean
  isUpdatingActive: boolean
  isUpdatingDeparture: boolean
  isUpdatingBaptism: boolean
  isUpdatingCampuses: boolean
  allCampuses: AvailableCampus[]
  onRoleChange: (memberId: string, newRole: AssignableRole) => Promise<void>
  onActiveChange: (memberId: string, active: boolean) => Promise<void>
  onDepartureChange: (memberId: string, dateOfDeparture: string | null, reasonForDeparture: string | null) => Promise<void>
  onBaptismChange: (memberId: string, baptism: boolean, baptismDate: string | null) => Promise<void>
  onCampusesChange: (memberId: string, campusIds: string[]) => Promise<void>
}
