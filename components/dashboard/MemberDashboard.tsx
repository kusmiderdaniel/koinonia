'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EventCalendar } from './EventCalendar'
import { MemberLinksPanel } from './MemberLinksPanel'
import { getCalendarEventsForMember, type CalendarEvent } from '@/app/dashboard/actions'
import { Link2 } from 'lucide-react'

export interface MemberLinksData {
  settings: {
    title: string | null
    bio: string | null
    backgroundColor: string | null
    backgroundGradientStart: string | null
    backgroundGradientEnd: string | null
    cardStyle: 'filled' | 'outline' | 'shadow'
    cardBorderRadius: string | null
    avatarUrl: string | null
    showChurchName: boolean
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

interface MemberDashboardProps {
  firstName: string
  initialEvents: CalendarEvent[]
  initialMonth: number
  initialYear: number
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat: '12h' | '24h'
  linksData?: MemberLinksData | null
}

export function MemberDashboard({
  firstName,
  initialEvents,
  initialMonth,
  initialYear,
  firstDayOfWeek,
  timeFormat,
  linksData,
}: MemberDashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isLoading, setIsLoading] = useState(false)

  const handleMonthChange = useCallback(async (month: number, year: number) => {
    setIsLoading(true)
    try {
      const result = await getCalendarEventsForMember(month, year)
      if (result.data) {
        setEvents(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasLinks = linksData && linksData.links.length > 0

  return (
    <div className="p-4 md:p-6">
      {/* Simple Header for Members */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {hasLinks ? 'Quick links and upcoming church events' : 'Check out upcoming church events'}
        </p>
      </div>

      {/* Layout: Links (1/3) | Calendar (2/3) on desktop, stacked on mobile */}
      {hasLinks ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Links Panel - 1/3 on desktop, full width on mobile (shown first) */}
          <div className="w-full lg:w-1/3">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Link2 className="h-5 w-5" />
              Quick Links
            </h2>
            <Card className="border border-black dark:border-zinc-700">
              <CardContent className="p-4 pt-5">
                <MemberLinksPanel
                  settings={linksData.settings}
                  links={linksData.links}
                  church={linksData.church}
                />
              </CardContent>
            </Card>
          </div>

          {/* Calendar - 2/3 on desktop, full width on mobile */}
          <div className={`w-full lg:w-2/3 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <EventCalendar
              events={events}
              firstDayOfWeek={firstDayOfWeek}
              timeFormat={timeFormat}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      ) : (
        /* Full-width Calendar when no links */
        <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
          <EventCalendar
            events={events}
            firstDayOfWeek={firstDayOfWeek}
            timeFormat={timeFormat}
            onMonthChange={handleMonthChange}
          />
        </div>
      )}
    </div>
  )
}
