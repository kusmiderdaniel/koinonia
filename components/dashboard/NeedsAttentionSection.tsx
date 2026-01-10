'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle,
  Check,
  X,
  Loader2,
  CheckCircle,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import { respondToInvitation } from '@/app/dashboard/events/actions/invitations'
import { updateTaskStatus } from '@/app/dashboard/tasks/actions'
import { toast } from 'sonner'
import type { DashboardAssignment } from '@/app/dashboard/actions'
import type { UrgentItem } from '@/lib/utils/dashboard-helpers'
import { dispatchNotificationRefresh } from '@/lib/events/notifications'

export type { UrgentItem }

interface NeedsAttentionSectionProps {
  items: UrgentItem[]
  maxItems?: number
  onTaskClick?: (taskId: string) => void
}

export function NeedsAttentionSection({ items, maxItems = 5, onTaskClick }: NeedsAttentionSectionProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'accept' | 'decline' | 'complete' | null>(null)

  const displayItems = items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  const handleRespondToInvitation = async (
    assignmentId: string,
    response: 'accepted' | 'declined',
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setLoadingId(assignmentId)
    setLoadingAction(response === 'accepted' ? 'accept' : 'decline')

    try {
      const result = await respondToInvitation(assignmentId, response)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(response === 'accepted' ? t('toasts.invitationAccepted') : t('toasts.invitationDeclined'))
        // Dispatch event to update notification counts immediately
        dispatchNotificationRefresh()
        router.refresh()
      }
    } catch {
      toast.error(t('toasts.somethingWentWrong'))
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
    }
  }

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingId(taskId)
    setLoadingAction('complete')

    try {
      const result = await updateTaskStatus(taskId, 'completed')
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('toasts.taskCompleted'))
        router.refresh()
      }
    } catch {
      toast.error(t('toasts.somethingWentWrong'))
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
    }
  }

  const handleNavigate = (item: UrgentItem) => {
    if (item.type === 'invitation') {
      const assignment = item.originalData as DashboardAssignment
      router.push(`/dashboard/events?event=${assignment.event.id}`)
    } else {
      // Open task dialog if callback provided, otherwise navigate to tasks page
      if (onTaskClick) {
        onTaskClick(item.id)
      } else {
        router.push('/dashboard/tasks')
      }
    }
  }

  if (items.length === 0) {
    return (
      <section className="p-4 border border-border rounded-lg bg-card h-full">
        <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          {t('needsAttention.allCaughtUp')}
        </h2>
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="py-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-green-700 dark:text-green-300 font-medium">{t('needsAttention.noPendingItems')}</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {t('needsAttention.allCaughtUpDescription')}
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="p-4 border border-border rounded-lg bg-card h-full">
      <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        {t('needsAttention.title')}
        <Badge className="bg-amber-100 text-amber-700 border-amber-300 px-1.5 py-0 h-5 text-xs">
          {items.length}
        </Badge>
      </h2>

      <div className="space-y-2">
        {displayItems.map((item) => (
          <Card
            key={`${item.type}-${item.id}`}
            onClick={() => handleNavigate(item)}
            className="cursor-pointer hover:bg-muted/50 transition-colors border border-border"
          >
            <CardContent className="p-3">
              <div className="flex gap-3">
                {/* Checkbox for tasks */}
                {item.type === 'task' && (
                  <div className="pt-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {loadingId === item.id && loadingAction === 'complete' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={false}
                        onClick={(e) => handleCompleteTask(item.id, e)}
                        className="h-5 w-5"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.type === 'invitation' ? (
                          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <CheckSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className="font-medium text-sm truncate">{item.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Due date badge */}
                    {item.dueLabel && (
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 rounded-full ${
                          item.isOverdue
                            ? 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/50 dark:border-red-800 dark:text-red-400'
                            : 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400'
                        }`}
                      >
                        {item.dueLabel}
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons for invitations */}
                  {item.type === 'invitation' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs rounded-full !bg-red-600 hover:!bg-red-700 !text-white"
                        onClick={(e) => handleRespondToInvitation(item.id, 'declined', e)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id && loadingAction === 'decline' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            {t('needsAttention.decline')}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs rounded-full !bg-green-600 hover:!bg-green-700 !text-white"
                        onClick={(e) => handleRespondToInvitation(item.id, 'accepted', e)}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id && loadingAction === 'accept' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            {t('needsAttention.accept')}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground"
            onClick={() => router.push('/dashboard/tasks')}
          >
            {t('needsAttention.viewMore', { count: items.length - maxItems })}
          </Button>
        )}
      </div>
    </section>
  )
}
