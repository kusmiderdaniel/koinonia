'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { DashboardHeader } from './DashboardHeader'
import { NeedsAttentionSection } from './NeedsAttentionSection'
import { WeekTimelineSection } from './WeekTimelineSection'
import { QuickAccessSection } from './QuickAccessSection'
import { ChurchCalendarSection } from './ChurchCalendarSection'
import { MemberLinksPanel } from './MemberLinksPanel'
import { PendingDisagreementBanner, type PendingDisagreement } from './PendingDisagreementBanner'
import { Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import type { UrgentItem, WeekItem } from '@/lib/utils/dashboard-helpers'
import type { DashboardEvent, CalendarEvent, Birthday, ChurchHoliday, CalendarBirthday } from '@/app/dashboard/actions'
import type { Task, TaskMinistry, TaskCampus, Person } from '@/app/dashboard/tasks/types'
import type { UserRole } from '@/lib/permissions'

export interface QuickLinksData {
  settings: {
    cardStyle: 'filled' | 'outline' | 'shadow'
    cardBorderRadius: string | null
    socialLinks: { platform: string; url: string }[]
  }
  links: Array<{
    id: string
    title: string
    url: string
    description: string | null
    icon: string | null
    imageUrl: string | null
    cardColor: string | null
    textColor: string | null
    cardSize: 'small' | 'medium' | 'large'
    hoverEffect: 'none' | 'scale' | 'glow' | 'lift'
    hideLabel: boolean
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
  }>
  church: {
    id: string
    name: string
    logoUrl: string | null
  }
}

interface DashboardClientProps {
  role: UserRole
  firstName: string
  pendingCount: number
  tasksCount: number
  weekCount: number
  urgentItems: UrgentItem[]
  weekItems: WeekItem[]
  events: DashboardEvent[]
  unavailabilityCount: number
  // For task sheet
  tasks: Task[]
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat: '12h' | '24h'
  // New props for role-based features
  calendarEvents?: CalendarEvent[]
  birthdays?: Birthday[]
  churchHolidays?: ChurchHoliday[]
  calendarBirthdays?: CalendarBirthday[]
  canCreateEvents?: boolean
  linksData?: QuickLinksData | null
  pendingDisagreements?: PendingDisagreement[]
  language?: 'en' | 'pl'
}

export function DashboardClient({
  role,
  firstName,
  pendingCount,
  tasksCount,
  weekCount,
  urgentItems,
  weekItems,
  events,
  unavailabilityCount,
  tasks,
  ministries,
  campuses,
  members,
  weekStartsOn,
  timeFormat,
  calendarEvents = [],
  birthdays = [],
  churchHolidays = [],
  calendarBirthdays = [],
  canCreateEvents = false,
  linksData,
  pendingDisagreements = [],
  language = 'en',
}: DashboardClientProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)

  // Get current month/year for calendar
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Check if user should see birthdays
  const showBirthdays = ['leader', 'admin', 'owner'].includes(role)

  // Check if links are available
  const hasLinks = linksData && linksData.links.length > 0

  const handleTaskClick = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setTaskSheetOpen(true)
    }
  }, [tasks])

  const handleTaskSheetClose = useCallback((open: boolean) => {
    setTaskSheetOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }, [])

  const handleTaskUpdated = useCallback(() => {
    router.refresh()
  }, [router])

  const handleTaskDeleted = useCallback(() => {
    setTaskSheetOpen(false)
    setSelectedTask(null)
    router.refresh()
  }, [router])

  return (
    <div className="p-4 md:p-6">
      {/* Pending Disagreement Banner */}
      <PendingDisagreementBanner
        disagreements={pendingDisagreements}
        language={language}
      />

      {/* Header */}
      <DashboardHeader
        firstName={firstName}
        pendingCount={pendingCount}
        tasksCount={tasksCount}
        weekCount={weekCount}
      />

      {/* Main sections - side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Needs Your Attention - Urgent items */}
        <NeedsAttentionSection
          items={urgentItems}
          onTaskClick={handleTaskClick}
        />

        {/* Your Week - Timeline of upcoming items */}
        <WeekTimelineSection
          items={weekItems}
          defaultExpanded={true}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Quick Access - Events, Birthdays (for leaders+), and Unavailability */}
      <QuickAccessSection
        events={events}
        birthdays={showBirthdays ? birthdays : undefined}
        unavailabilityCount={unavailabilityCount}
        weekStartsOn={weekStartsOn}
        timeFormat={timeFormat}
      />

      {/* Links and Church Calendar - side by side when links exist */}
      {hasLinks ? (
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Links Panel - 1/3 on desktop, full width on mobile (shown first) */}
          <div className="w-full lg:w-1/3">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Link2 className="h-5 w-5" />
              {t('quickLinks.title')}
            </h2>
            <Card className="border border-black dark:border-zinc-700">
              <CardContent className="p-4 pt-5">
                <MemberLinksPanel
                  settings={{
                    ...linksData.settings,
                    title: null,
                    bio: null,
                    backgroundColor: null,
                    backgroundGradientStart: null,
                    backgroundGradientEnd: null,
                    avatarUrl: null,
                    showChurchName: false,
                  }}
                  links={linksData.links}
                  church={linksData.church}
                />
              </CardContent>
            </Card>
          </div>

          {/* Calendar - 2/3 on desktop, full width on mobile */}
          <div className="w-full lg:w-2/3">
            <ChurchCalendarSection
              initialEvents={calendarEvents}
              initialHolidays={churchHolidays}
              initialBirthdays={calendarBirthdays}
              initialMonth={currentMonth}
              initialYear={currentYear}
              firstDayOfWeek={weekStartsOn}
              timeFormat={timeFormat}
              role={role}
              canCreateEvents={canCreateEvents}
            />
          </div>
        </div>
      ) : (
        /* Full-width Calendar when no links */
        <ChurchCalendarSection
          initialEvents={calendarEvents}
          initialHolidays={churchHolidays}
          initialBirthdays={calendarBirthdays}
          initialMonth={currentMonth}
          initialYear={currentYear}
          firstDayOfWeek={weekStartsOn}
          timeFormat={timeFormat}
          role={role}
          canCreateEvents={canCreateEvents}
        />
      )}

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={taskSheetOpen}
        onOpenChange={handleTaskSheetClose}
        onTaskUpdated={handleTaskUpdated}
        onDelete={handleTaskDeleted}
        members={members}
        ministries={ministries}
        campuses={campuses}
        weekStartsOn={weekStartsOn}
        canDelete={false}
      />
    </div>
  )
}
