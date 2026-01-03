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
import { getStatusStyles } from './utils'
import type { PositionsTabProps, Assignment } from './types'

const StatusBadge = memo(function StatusBadge({
  status,
  badgeClass,
}: {
  status: Assignment['status']
  badgeClass: string
}) {
  switch (status) {
    case 'accepted':
      return (
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          <Check className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      )
    case 'declined':
      return (
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      )
    case 'invited':
      return (
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          <Send className="w-3 h-3 mr-1" />
          Invited
        </Badge>
      )
    case 'expired':
      return (
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          <ClockIcon className="w-3 h-3 mr-1" />
          Expired
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
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0">
      <div className="flex items-center justify-end mb-4">
        {canManageContent && (
          <div className="flex gap-2">
            {pendingInvitationsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="!rounded-full !border !border-brand text-brand hover:bg-brand/10"
                onClick={onSendInvitations}
              >
                <Send className="w-4 h-4 mr-1" />
                Send Invitations ({pendingInvitationsCount})
              </Button>
            )}
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-gray-300 dark:!border-zinc-600"
              onClick={onAddPosition}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Position
            </Button>
          </div>
        )}
      </div>

      {Object.keys(positionsByMinistry).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No positions added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(positionsByMinistry).map(({ ministry, positions }) => (
            <div key={ministry.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ministry.color }} />
                <h3 className="font-medium text-sm">{ministry.name}</h3>
              </div>
              <div className="space-y-2 pl-5">
                {positions.map((position) => {
                  const hasAssignment = position.event_assignments.length > 0
                  const assignment = hasAssignment ? position.event_assignments[0] : null

                  return (
                    <div key={position.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{position.title}</span>
                          {position.role && position.role.name !== position.title && (
                            <Badge variant="outline" className="text-xs rounded-full">
                              {position.role.name}
                            </Badge>
                          )}
                        </div>
                        {canManageContent && (
                          <div className="flex gap-1">
                            {!hasAssignment && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full h-7 text-xs !border !border-black dark:!border-zinc-700"
                                onClick={() => onAssignVolunteer(position)}
                              >
                                <UserPlus className="w-3 h-3 mr-1" />
                                Assign
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEditPosition(position)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
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
  )
})

const AssignmentCard = memo(function AssignmentCard({
  assignment,
  positionTitle,
  multiAssignedProfiles,
  canManageContent,
  onUnassign,
}: {
  assignment: Assignment
  positionTitle: string
  multiAssignedProfiles: Map<string, string[]>
  canManageContent: boolean
  onUnassign: (assignment: Assignment, positionTitle: string) => void
}) {
  const isMultiAssigned = multiAssignedProfiles.has(assignment.profile.id)
  const otherPositions = isMultiAssigned
    ? multiAssignedProfiles.get(assignment.profile.id)?.filter((p) => p !== positionTitle) || []
    : []
  const statusStyles = getStatusStyles(assignment.status)

  return (
    <div
      className={`mt-2 flex items-center justify-between py-2 px-3 rounded-lg ${statusStyles.bg} border ${statusStyles.border}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${statusStyles.iconBg}`}
          >
            <User className={`w-3 h-3 ${statusStyles.iconColor}`} />
          </div>
          <span className="text-sm font-medium">
            {assignment.profile.first_name} {assignment.profile.last_name}
          </span>
          <StatusBadge status={assignment.status} badgeClass={statusStyles.badgeClass} />
          {isMultiAssigned && (
            <Badge
              variant="outline"
              className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Multiple roles
            </Badge>
          )}
        </div>
        {isMultiAssigned && otherPositions.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-8">
            Also assigned to: {otherPositions.join(', ')}
          </p>
        )}
      </div>
      {canManageContent && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
          onClick={() => onUnassign(assignment, positionTitle)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
})
