'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Calendar, Clock, Loader2 } from 'lucide-react'
import type { Notification } from '@/types/notifications'
import { respondToInvitation } from '@/app/dashboard/events/actions/invitations'
import { toast } from 'sonner'

interface NotificationItemProps {
  notification: Notification
  onActionComplete?: () => void
  onNavigateToEvent?: () => void
}

export function NotificationItem({ notification, onActionComplete, onNavigateToEvent }: NotificationItemProps) {
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | null>(null)

  const isActionable =
    notification.type === 'position_invitation' &&
    !notification.is_actioned &&
    notification.assignment_id

  const handleRespond = async (response: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.assignment_id) return

    setIsLoading(response === 'accepted' ? 'accept' : 'decline')

    try {
      const result = await respondToInvitation(notification.assignment_id, response)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(response === 'accepted' ? 'Invitation accepted!' : 'Invitation declined')
        onActionComplete?.()
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(null)
    }
  }

  const getActionBadge = () => {
    if (!notification.is_actioned) return null

    switch (notification.action_taken) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <X className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  const ministryColor = notification.assignment?.position?.ministry?.color

  const handleClick = () => {
    if (onNavigateToEvent) {
      onNavigateToEvent()
    }
  }

  return (
    <div
      className={`p-3 border-b last:border-b-0 transition-colors ${
        notification.is_read ? 'bg-white dark:bg-zinc-950' : 'bg-blue-50/50 dark:bg-blue-950/20'
      } ${onNavigateToEvent ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Ministry color indicator */}
        {ministryColor && (
          <div
            className="w-1 rounded-full flex-shrink-0 self-stretch"
            style={{ backgroundColor: ministryColor }}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${notification.is_read ? 'font-normal' : 'font-semibold'}`}>
                {notification.title}
              </p>
              {notification.message && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              )}
            </div>
            {getActionBadge()}
          </div>

          {/* Event info */}
          {notification.event && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{notification.event.title}</span>
              <span>•</span>
              <span>
                {new Date(notification.event.start_time).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Position info */}
          {notification.assignment?.position && (
            <div className="mt-1 text-xs text-muted-foreground">
              Position: {notification.assignment.position.title}
              {notification.assignment.position.ministry?.name && (
                <span> • {notification.assignment.position.ministry.name}</span>
              )}
            </div>
          )}

          {/* Timestamp and actions */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>

            {isActionable && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-3 text-xs rounded-full !bg-red-600 hover:!bg-red-700 !text-white"
                  onClick={(e) => handleRespond('declined', e)}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'decline' ? (
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
                  onClick={(e) => handleRespond('accepted', e)}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'accept' ? (
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
      </div>
    </div>
  )
}
