import type { CSSProperties } from 'react'
import type { Member, AssignableRole } from '../member-table-types'
import type { PeopleColumnKey } from '../../members-table/columns'
import type { CustomFieldValueType } from '@/types/custom-fields'

interface AvailableCampus {
  id: string
  name: string
  color: string
  is_default: boolean
}

// Base props that all cells share
export interface BaseCellProps {
  member: Member
  columnKey: PeopleColumnKey
  getColumnStyle: (key: PeopleColumnKey) => CSSProperties
  getFrozenClasses: (key: PeopleColumnKey) => string
}

// Props for cells that allow editing
export interface EditableCellProps extends BaseCellProps {
  canEdit: boolean
  isUpdating: boolean
}

// Specific cell prop types
export interface ActiveCellProps extends BaseCellProps {
  canEditActiveStatus: boolean
  isUpdatingActive: boolean
  onActiveChange: (memberId: string, active: boolean) => void
}

export interface NameCellProps extends BaseCellProps {
  currentUserId: string
  canDeleteOffline: boolean
  onDeleteOffline: (member: Member) => void
}

export interface EmailCellProps extends BaseCellProps {
  canEditOfflineProfile: boolean
  isUpdatingProfile: boolean
  onProfileChange: (memberId: string, data: { email?: string | null }) => void
}

export interface PhoneCellProps extends BaseCellProps {
  canEditOfflineProfile: boolean
  isUpdatingProfile: boolean
  onProfileChange: (memberId: string, data: { phone?: string | null }) => void
}

export interface RoleCellProps extends BaseCellProps {
  canEditRole: boolean
  isUpdatingRole: boolean
  onRoleChange: (memberId: string, newRole: AssignableRole) => void
}

export interface CampusCellProps extends BaseCellProps {
  canEditFields: boolean
  isUpdatingCampuses: boolean
  allCampuses: AvailableCampus[]
  onCampusesChange: (memberId: string, campusIds: string[]) => void
}

export interface MinistryRolesCellProps extends BaseCellProps {}

export interface GenderCellProps extends BaseCellProps {
  canEditOfflineProfile: boolean
  isUpdatingProfile: boolean
  onProfileChange: (memberId: string, data: { sex?: string | null }) => void
}

export interface DateOfBirthCellProps extends BaseCellProps {
  canEditOfflineProfile: boolean
  isUpdatingProfile: boolean
  onProfileChange: (memberId: string, data: { dateOfBirth?: string | null }) => void
}

export interface AgeCellProps extends BaseCellProps {}

export interface BaptizedCellProps extends BaseCellProps {
  canEditFields: boolean
  isUpdatingBaptism: boolean
  onBaptismChange: (memberId: string, baptism: boolean, date: string | null) => void
}

export interface BaptismDateCellProps extends BaseCellProps {
  canEditFields: boolean
  isUpdatingBaptism: boolean
  onBaptismChange: (memberId: string, baptism: boolean, date: string | null) => void
}

export interface DepartureDateCellProps extends BaseCellProps {
  canEditDeparture: boolean
  isUpdatingDeparture: boolean
  onDepartureChange: (memberId: string, date: string | null, reason: string | null) => void
}

export interface DepartureReasonCellProps extends BaseCellProps {
  canEditDeparture: boolean
  isUpdatingDeparture: boolean
  onDepartureChange: (memberId: string, date: string | null, reason: string | null) => void
}

export interface JoinedCellProps extends BaseCellProps {}

export interface UserTypeCellProps extends BaseCellProps {}
