'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckSquare, Calendar } from 'lucide-react'
import { InvitePopover } from '@/app/dashboard/people/invite-popover'

interface DashboardHeaderProps {
  firstName: string
  pendingCount: number
  tasksCount: number
  weekCount: number
  joinCode?: string | null
}

export function DashboardHeader({
  firstName,
  pendingCount,
  tasksCount,
  weekCount,
  joinCode,
}: DashboardHeaderProps) {
  const t = useTranslations('dashboard')
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold">{t('welcome', { name: firstName })}</h1>
        {joinCode && <InvitePopover joinCode={joinCode} />}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
        {pendingCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-card">
            <Bell className="w-3.5 h-3.5" />
            <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs font-medium">
              {pendingCount}
            </Badge>
            {t('header.pending')}
          </span>
        )}
        {tasksCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-card">
            <CheckSquare className="w-3.5 h-3.5" />
            <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs font-medium">
              {tasksCount}
            </Badge>
            {t('header.tasks')}
          </span>
        )}
        <span className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg bg-card">
          <Calendar className="w-3.5 h-3.5" />
          <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs font-medium">
            {weekCount}
          </Badge>
          {t('header.thisWeek')}
        </span>
      </div>
    </div>
  )
}
