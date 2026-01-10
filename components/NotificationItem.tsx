'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Check, X, Calendar, Clock, Loader2, Eye } from 'lucide-react'
import type { Notification, NotificationType } from '@/types/notifications'
import { respondToInvitation } from '@/app/dashboard/events/actions/invitations'
import { markAsRead } from '@/app/dashboard/notifications/actions'
import { toast } from 'sonner'
import { dispatchNotificationRefresh } from '@/lib/events/notifications'
import { enUS, pl } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  onActionComplete?: () => void
  onNavigateToEvent?: () => void
}

export function NotificationItem({ notification, onActionComplete, onNavigateToEvent }: NotificationItemProps) {
  const t = useTranslations('inbox.notification')
  const locale = useLocale()
  const dateLocale = locale === 'pl' ? pl : enUS
  const [isLoading, setIsLoading] = useState<'accept' | 'decline' | 'read' | null>(null)
  const [isChangingResponse, setIsChangingResponse] = useState(false)

  // Get translated title and message based on notification type
  const getTranslatedTitle = () => {
    // For invitation_response, detect accepted/declined from stored title and translate
    if (notification.type === 'invitation_response') {
      const storedTitle = notification.title.toLowerCase()
      const isAccepted = storedTitle.includes('accepted')
      const responseType = isAccepted ? 'accepted' : 'declined'
      // Get emoji from original title (first character if it's an emoji)
      const emoji = notification.title.match(/^[\u{1F300}-\u{1F9FF}]|^[✅❌]/u)?.[0] || ''
      const translatedTitle = t(`types.invitation_response.${responseType}.title`)
      return emoji ? `${emoji} ${translatedTitle}` : translatedTitle
    }
    const typeKey = notification.type as NotificationType
    try {
      return t(`types.${typeKey}.title`)
    } catch {
      return notification.title
    }
  }

  const getTranslatedMessage = () => {
    // For invitation_response, extract responder name and translate
    if (notification.type === 'invitation_response') {
      const storedTitle = notification.title.toLowerCase()
      const isAccepted = storedTitle.includes('accepted')
      const responseType = isAccepted ? 'accepted' : 'declined'
      // Extract responder name from stored message (format: "Name has accepted/declined...")
      const responderMatch = notification.message?.match(/^(.+?) has (accepted|declined)/i)
      const responder = responderMatch?.[1] || ''
      const position = notification.assignment?.position?.title || ''
      const event = notification.event?.title || ''
      try {
        return t(`types.invitation_response.${responseType}.message`, { responder, position, event })
      } catch {
        return notification.message
      }
    }
    const typeKey = notification.type as NotificationType
    const position = notification.assignment?.position?.title || ''
    const event = notification.event?.title || ''
    try {
      const template = t(`types.${typeKey}.message`, { position, event })
      return template || notification.message
    } catch {
      return notification.message
    }
  }

  const isActionable =
    notification.type === 'position_invitation' &&
    !notification.is_actioned &&
    notification.assignment_id

  // Can change response if already actioned (not expired) and still has assignment
  const canChangeResponse =
    notification.type === 'position_invitation' &&
    notification.is_actioned &&
    notification.action_taken !== 'expired' &&
    notification.assignment_id

  // Show "Read" button for non-invitation notifications that are unread
  const showReadButton =
    notification.type !== 'position_invitation' &&
    !notification.is_read

  const handleRespond = async (response: 'accepted' | 'declined', e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.assignment_id) return

    setIsLoading(response === 'accepted' ? 'accept' : 'decline')

    try {
      const result = await respondToInvitation(notification.assignment_id, response)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(response === 'accepted' ? t('toast.accepted') : t('toast.declined'))
        setIsChangingResponse(false)
        // Dispatch event to update notification counts immediately
        dispatchNotificationRefresh()
        onActionComplete?.()
      }
    } catch (error) {
      toast.error(t('toast.error'))
    } finally {
      setIsLoading(null)
    }
  }

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLoading('read')

    try {
      const result = await markAsRead(notification.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        dispatchNotificationRefresh()
        onActionComplete?.()
      }
    } catch (error) {
      toast.error(t('toast.error'))
    } finally {
      setIsLoading(null)
    }
  }

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canChangeResponse) {
      setIsChangingResponse(true)
    }
  }

  const handleCancelChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsChangingResponse(false)
  }

  const renderStatusBadge = () => {
    if (!notification.is_actioned) return null

    const isAccepted = notification.action_taken === 'accepted'
    const isDeclined = notification.action_taken === 'declined'
    const isExpired = notification.action_taken === 'expired'

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          {t('status.expired')}
        </span>
      )
    }

    if (isAccepted) {
      return (
        <button
          onClick={handleBadgeClick}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
        >
          <Check className="w-3 h-3 mr-1" />
          {t('status.accepted')}
        </button>
      )
    }

    if (isDeclined) {
      return (
        <button
          onClick={handleBadgeClick}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3 mr-1" />
          {t('status.declined')}
        </button>
      )
    }

    return null
  }

  const ministryColor = notification.assignment?.position?.ministry?.color

  const handleClick = () => {
    if (onNavigateToEvent) {
      onNavigateToEvent()
    }
  }

  return (
    <div
      className={`p-3 md:p-4 border rounded-lg transition-colors ${
        notification.is_read ? 'bg-white dark:bg-zinc-950' : 'bg-blue-50/50 dark:bg-blue-950/20'
      } ${onNavigateToEvent ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-2 md:gap-3">
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
              <p className={`text-sm md:text-base ${notification.is_read ? 'font-normal' : 'font-semibold'}`}>
                {getTranslatedTitle()}
              </p>
              {getTranslatedMessage() && (
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {getTranslatedMessage()}
                </p>
              )}
            </div>
            {!isChangingResponse && renderStatusBadge()}
          </div>

          {/* Event info */}
          {notification.event && (
            <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{notification.event.title}</span>
              <span className="hidden md:inline">•</span>
              <span className="w-full md:w-auto">
                {new Date(notification.event.start_time).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', {
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
              <span className="font-medium">{t('labels.position')}</span> {notification.assignment.position.title}
              {notification.assignment.position.ministry?.name && (
                <span> • {notification.assignment.position.ministry.name}</span>
              )}
            </div>
          )}

          {/* Timestamp and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
            </span>

            {/* Initial response buttons */}
            {isActionable && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full !bg-red-600 hover:!bg-red-700 !text-white flex-1 sm:flex-none"
                  onClick={(e) => handleRespond('declined', e)}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'decline' ? (
                    <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                      {t('actions.decline')}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full !bg-green-600 hover:!bg-green-700 !text-white flex-1 sm:flex-none"
                  onClick={(e) => handleRespond('accepted', e)}
                  disabled={isLoading !== null}
                >
                  {isLoading === 'accept' ? (
                    <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                      {t('actions.accept')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Change response buttons */}
            {isChangingResponse && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full flex-1 sm:flex-none"
                  onClick={handleCancelChange}
                  disabled={isLoading !== null}
                >
                  {t('actions.cancel')}
                </Button>
                {notification.action_taken === 'accepted' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full !bg-red-600 hover:!bg-red-700 !text-white flex-1 sm:flex-none"
                    onClick={(e) => handleRespond('declined', e)}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'decline' ? (
                      <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                        <span className="hidden sm:inline">{t('actions.declineInstead')}</span>
                        <span className="sm:hidden">{t('actions.decline')}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full !bg-green-600 hover:!bg-green-700 !text-white flex-1 sm:flex-none"
                    onClick={(e) => handleRespond('accepted', e)}
                    disabled={isLoading !== null}
                  >
                    {isLoading === 'accept' ? (
                      <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                        <span className="hidden sm:inline">{t('actions.acceptInstead')}</span>
                        <span className="sm:hidden">{t('actions.accept')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Mark as read button for non-invitation notifications */}
            {showReadButton && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 md:h-7 px-4 md:px-3 text-sm md:text-xs rounded-full !border-black dark:!border-white"
                onClick={handleMarkAsRead}
                disabled={isLoading !== null}
              >
                {isLoading === 'read' ? (
                  <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                ) : (
                  <>
                    <Eye className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                    {t('actions.markAsRead')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
