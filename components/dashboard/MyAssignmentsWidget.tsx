'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Check, X, Loader2, ChevronRight } from 'lucide-react'
import { respondToInvitation } from '@/app/dashboard/events/actions/invitations'
import { toast } from 'sonner'
import type { DashboardAssignment } from '@/app/dashboard/actions'

interface MyAssignmentsWidgetProps {
  assignments: DashboardAssignment[]
  onUpdate?: () => void
}

export function MyAssignmentsWidget({ assignments, onUpdate }: MyAssignmentsWidgetProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'accept' | 'decline' | null>(null)

  const handleRespond = async (assignmentId: string, response: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingId(assignmentId)
    setLoadingAction(response === 'accepted' ? 'accept' : 'decline')

    try {
      const result = await respondToInvitation(assignmentId, response)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(response === 'accepted' ? 'Invitation accepted!' : 'Invitation declined')
        onUpdate?.()
        router.refresh()
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: DashboardAssignment['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
            <X className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
      case 'invited':
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
            Pending
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="secondary" className="text-xs">
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  const handleNavigate = (eventId: string) => {
    router.push(`/dashboard/events?event=${eventId}`)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          My Upcoming Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming assignments</p>
            <p className="text-xs mt-1">You'll see your assigned positions here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => handleNavigate(assignment.event.id)}
                className="flex gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                {/* Ministry color bar */}
                <div
                  className="w-1 rounded-full flex-shrink-0 self-stretch"
                  style={{ backgroundColor: assignment.ministry.color }}
                />

                <div className="flex-1 min-w-0">
                  {/* Position and Event */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {assignment.position.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.event.title}
                      </p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  {/* Date and Ministry */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(assignment.event.start_time)}</span>
                    <span>•</span>
                    <span>{assignment.ministry.name}</span>
                  </div>

                  {/* Action buttons for invited status */}
                  {assignment.status === 'invited' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-3 text-xs rounded-full !bg-red-600 hover:!bg-red-700 !text-white"
                        onClick={(e) => handleRespond(assignment.id, 'declined', e)}
                        disabled={loadingId === assignment.id}
                      >
                        {loadingId === assignment.id && loadingAction === 'decline' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-3 text-xs rounded-full !bg-green-600 hover:!bg-green-700 !text-white"
                        onClick={(e) => handleRespond(assignment.id, 'accepted', e)}
                        disabled={loadingId === assignment.id}
                      >
                        {loadingId === assignment.id && loadingAction === 'accept' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* View all link */}
            <Link
              href="/dashboard/events"
              className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground pt-2"
            >
              View all events
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
