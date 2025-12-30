'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { updateMemberRole, updateMemberActive, updateMemberDeparture, updateMemberBaptism } from './actions'
import { FilterBuilder } from './filter-builder'
import { FilterState, createEmptyFilterState } from './filter-types'
import { applyFilters, countActiveFilters } from './filter-logic'
import { SortBuilder } from './sort-builder'
import { SortState, createEmptySortState } from './sort-types'
import { applySorts, countActiveSorts } from './sort-logic'
import { MemberRow } from './components'
import {
  type Member,
  type Role,
  type AssignableRole,
  roleHierarchy,
} from './components/member-table-types'

interface MembersTableProps {
  members: Member[]
  currentUserId: string
  currentUserRole: string
}

export const MembersTable = memo(function MembersTable({ members, currentUserId, currentUserRole }: MembersTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null)
  const [updatingDepartureId, setUpdatingDepartureId] = useState<string | null>(null)
  const [updatingBaptismId, setUpdatingBaptismId] = useState<string | null>(null)
  const [filterState, setFilterState] = useState<FilterState>(createEmptyFilterState)
  const [sortState, setSortState] = useState<SortState>(createEmptySortState)

  const canEditActive = ['owner', 'admin', 'leader'].includes(currentUserRole)
  const canEditFields = ['owner', 'admin', 'leader'].includes(currentUserRole)

  // Apply filters and sorts to members
  const filteredAndSortedMembers = useMemo(() => {
    const filtered = applyFilters(members, filterState)
    return applySorts(filtered, sortState)
  }, [members, filterState, sortState])

  const activeFilterCount = countActiveFilters(filterState)
  const activeSortCount = countActiveSorts(sortState)

  // Permission checks
  const canEditRole = useCallback((member: Member) => {
    if (member.member_type === 'offline') return false
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole])

  const canEditActiveStatus = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditActive) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditActive])

  const canEditDeparture = useCallback((member: Member) => {
    if (member.id === currentUserId) return false
    if (member.role === 'owner') return false
    if (!canEditFields) return false

    const currentLevel = roleHierarchy[currentUserRole as Role] || 0
    const memberLevel = roleHierarchy[member.role as Role] || 0
    return currentLevel > memberLevel
  }, [currentUserId, currentUserRole, canEditFields])

  // Handlers
  const handleRoleChange = useCallback(async (memberId: string, newRole: AssignableRole) => {
    setUpdatingId(memberId)
    try {
      const result = await updateMemberRole(memberId, newRole)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleActiveChange = useCallback(async (memberId: string, active: boolean) => {
    setUpdatingActiveId(memberId)
    try {
      const result = await updateMemberActive(memberId, active)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingActiveId(null)
    }
  }, [])

  const handleDepartureChange = useCallback(async (
    memberId: string,
    dateOfDeparture: string | null,
    reasonForDeparture: string | null
  ) => {
    setUpdatingDepartureId(memberId)
    try {
      const result = await updateMemberDeparture(memberId, dateOfDeparture, reasonForDeparture)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingDepartureId(null)
    }
  }, [])

  const handleBaptismChange = useCallback(async (
    memberId: string,
    baptism: boolean,
    baptismDate: string | null
  ) => {
    setUpdatingBaptismId(memberId)
    try {
      const result = await updateMemberBaptism(memberId, baptism, baptismDate)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingBaptismId(null)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Filter and Sort toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SortBuilder sortState={sortState} onChange={setSortState} />
          <FilterBuilder filterState={filterState} onChange={setFilterState} />
        </div>
        {(activeFilterCount > 0 || activeSortCount > 0) && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Active</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Email
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot be changed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Ministry Roles</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Sex
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Can be changed in user&apos;s profile settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Date of Birth
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Can be changed in user&apos;s profile settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableHead>
            <TableHead>Age</TableHead>
            <TableHead className="w-[70px]">Baptized</TableHead>
            <TableHead>Baptism Date</TableHead>
            <TableHead>Departure Date</TableHead>
            <TableHead>Departure Reason</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              canEditRole={canEditRole(member)}
              canEditActiveStatus={canEditActiveStatus(member)}
              canEditDeparture={canEditDeparture(member)}
              canEditFields={canEditFields}
              isUpdatingRole={updatingId === member.id}
              isUpdatingActive={updatingActiveId === member.id}
              isUpdatingDeparture={updatingDepartureId === member.id}
              isUpdatingBaptism={updatingBaptismId === member.id}
              onRoleChange={handleRoleChange}
              onActiveChange={handleActiveChange}
              onDepartureChange={handleDepartureChange}
              onBaptismChange={handleBaptismChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
})
