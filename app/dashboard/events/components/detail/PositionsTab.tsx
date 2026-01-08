'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  User,
  AlertTriangle,
  Send,
  Check,
  XCircle,
  Clock as ClockIcon,
} from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { getStatusStyles } from './utils'
import type { PositionsTabProps, Assignment } from './types'

const StatusBadge = memo(function StatusBadge({
  status,
  badgeClass,
  isMobile,
}: {
  status: Assignment['status']
  badgeClass: string
  isMobile?: boolean
}) {
  const iconClass = isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3 mr-1'
  const badgeSizeClass = isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs'

  switch (status) {
    case 'accepted':
      return (
        <Badge variant="outline" className={`${badgeSizeClass} ${badgeClass}`}>
          <Check className={iconClass} />
          {!isMobile && 'Accepted'}
        </Badge>
      )
    case 'declined':
      return (
        <Badge variant="outline" className={`${badgeSizeClass} ${badgeClass}`}>
          <XCircle className={iconClass} />
          {!isMobile && 'Declined'}
        </Badge>
      )
    case 'invited':
      return (
        <Badge variant="outline" className={`${badgeSizeClass} ${badgeClass}`}>
          <Send className={iconClass} />
          {!isMobile && 'Invited'}
        </Badge>
      )
    case 'expired':
      return (
        <Badge variant="outline" className={`${badgeSizeClass} ${badgeClass}`}>
          <ClockIcon className={iconClass} />
          {!isMobile && 'Expired'}
        </Badge>
      )
    default:
      return null
  }
})

export const PositionsTab = memo(function PositionsTab({
  positionsByMinistry,
  canManageContent,
  pendingInvitationsCount,
  multiAssignedProfiles,
  onAddPosition,
  onEditPosition,
  onDeletePosition,
  onAssignVolunteer,
  onUnassign,
  onSendInvitations,
}: PositionsTabProps) {
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'pl-6 pr-6 py-4'}`}>
        {canManageContent && (
          <div className={`flex gap-2 ${isMobile ? '' : 'justify-end'}`}>
            {pendingInvitationsCount > 0 && (
              <Button
                variant="outline-pill"
                size="sm"
                className={`!border !border-brand text-brand hover:bg-brand/10 ${isMobile ? 'text-xs h-8' : ''}`}
                onClick={onSendInvitations}
              >
                <Send className={isMobile ? 'w-3.5 h-3.5 mr-1' : 'w-4 h-4 mr-1'} />
                {isMobile ? `Send (${pendingInvitationsCount})` : `Send Invitations (${pendingInvitationsCount})`}
              </Button>
            )}
            <Button
              variant="outline-pill"
              size="sm"
              className={`!border !border-black dark:!border-white ${isMobile ? 'text-xs h-8' : ''}`}
              onClick={onAddPosition}
            >
              <Plus className={isMobile ? 'w-3.5 h-3.5 mr-1' : 'w-4 h-4 mr-1'} />
              {isMobile ? 'Add' : 'Add Position'}
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-minimal ${isMobile ? 'px-3 pb-3' : 'pl-6 pr-6 pb-6'}`}>
        {Object.keys(positionsByMinistry).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No positions added yet</p>
        </div>
      ) : (
        <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {Object.values(positionsByMinistry).map(({ ministry, positions }) => (
            <div key={ministry.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ministry.color }} />
                <h3 className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{ministry.name}</h3>
              </div>
              <div className={`space-y-1.5 ${isMobile ? 'pl-3' : 'pl-5'}`}>
                {positions.map((position) => {
                  const hasAssignment = position.event_assignments.length > 0
                  const assignment = hasAssignment ? position.event_assignments[0] : null

                  return (
                    <div
                      key={position.id}
                      className={`rounded-lg border ${isMobile ? 'p-2' : 'p-3'}`}
                      style={{
                        backgroundColor: `${ministry.color}15`,
                        borderColor: `${ministry.color}40`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className={`font-medium truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{position.title}</span>
                          {position.role && position.role.name !== position.title && !isMobile && (
                            <Badge variant="outline" className="text-xs rounded-full flex-shrink-0">
                              {position.role.name}
                            </Badge>
                          )}
                        </div>
                        {canManageContent && (
                          <div className="flex items-center flex-shrink-0">
                            {!hasAssignment && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`rounded-full !border !border-black dark:!border-zinc-700 ${isMobile ? 'h-6 text-[10px] px-2' : 'h-7 text-xs'}`}
                                onClick={() => onAssignVolunteer(position)}
                              >
                                <UserPlus className={isMobile ? 'w-3 h-3 mr-0.5' : 'w-3 h-3 mr-1'} />
                                Assign
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={isMobile ? 'h-6 w-6' : 'h-7 w-7'}
                              onClick={() => onEditPosition(position)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                              onClick={() => onDeletePosition(position)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {assignment && (
                        <AssignmentCard
                          assignment={assignment}
                          positionTitle={position.title}
                          multiAssignedProfiles={multiAssignedProfiles}
                          canManageContent={canManageContent}
                          onUnassign={onUnassign}
                          isMobile={isMobile}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
})

const AssignmentCard = memo(function AssignmentCard({
  assignment,
  positionTitle,
  multiAssignedProfiles,
  canManageContent,
  onUnassign,
  isMobile,
}: {
  assignment: Assignment
  positionTitle: string
  multiAssignedProfiles: Map<string, string[]>
  canManageContent: boolean
  onUnassign: (assignment: Assignment, positionTitle: string) => void
  isMobile: boolean
}) {
  const isMultiAssigned = multiAssignedProfiles.has(assignment.profile.id)
  const otherPositions = isMultiAssigned
    ? multiAssignedProfiles.get(assignment.profile.id)?.filter((p) => p !== positionTitle) || []
    : []
  const statusStyles = getStatusStyles(assignment.status)

  return (
    <div
      className={`mt-1.5 flex items-center justify-between rounded-lg ${statusStyles.bg} border ${statusStyles.border} ${isMobile ? 'py-1.5 px-2' : 'py-2 px-3'}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div
            className={`rounded-full flex items-center justify-center ${statusStyles.iconBg} ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          >
            <User className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${statusStyles.iconColor}`} />
          </div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {assignment.profile.first_name} {assignment.profile.last_name}
          </span>
          <StatusBadge status={assignment.status} badgeClass={statusStyles.badgeClass} isMobile={isMobile} />
          {isMultiAssigned && !isMobile && (
            <Badge
              variant="outline"
              className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Multiple roles
            </Badge>
          )}
        </div>
        {isMultiAssigned && isMobile && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 ml-6">
            Multiple roles
          </p>
        )}
        {isMultiAssigned && otherPositions.length > 0 && !isMobile && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-8">
            Also assigned to: {otherPositions.join(', ')}
          </p>
        )}
      </div>
      {canManageContent && (
        <Button
          variant="ghost"
          size="icon"
          className={`text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}
          onClick={() => onUnassign(assignment, positionTitle)}
        >
          <Trash2 className={isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </Button>
      )}
    </div>
  )
})
