'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckSquare,
  Clock,
} from 'lucide-react'
import { format, isToday, isTomorrow, startOfDay } from 'date-fns'
import type { DashboardAssignment } from '@/app/dashboard/actions'
import type { WeekItem } from '@/lib/utils/dashboard-helpers'

export type { WeekItem }

interface DayGroup {
  label: string
  date: Date
  items: WeekItem[]
}

interface WeekTimelineSectionProps {
  items: WeekItem[]
  defaultExpanded?: boolean
  onTaskClick?: (taskId: string) => void
}

export function WeekTimelineSection({ items, defaultExpanded = true, onTaskClick }: WeekTimelineSectionProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Helper function to get day label with translations
  const getDayLabelTranslated = (date: Date): string => {
    if (isToday(date)) return t('yourWeek.today')
    if (isTomorrow(date)) return t('yourWeek.tomorrow')
    return format(date, 'EEEE, MMM d')
  }

  // Group items by day
  const dayGroups = groupItemsByDay(items, getDayLabelTranslated)

  const handleNavigate = (item: WeekItem) => {
    if (item.type === 'assignment') {
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
      <section className="p-4 border border-black dark:border-white rounded-lg bg-card h-full">
        <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          {t('yourWeek.title')}
        </h2>
        <Card className="bg-muted/30 border border-black/20 dark:border-white/20 !ring-0 outline-none">
          <CardContent className="py-6 text-center">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground font-medium">{t('yourWeek.nothingScheduled')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('yourWeek.emptyDescription')}
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="p-4 border border-black dark:border-white rounded-lg bg-card h-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          {t('yourWeek.title')}
          <Badge variant="secondary" className="px-1.5 py-0 h-5 text-xs">
            {items.length}
          </Badge>
        </h2>
        <div className="md:hidden text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      <div className={`space-y-4 ${!isExpanded ? 'hidden md:block' : ''}`}>
        {dayGroups.map((group) => (
          <div key={group.label}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Day items */}
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleNavigate(item)}
                  className="px-3 py-2 cursor-pointer hover:opacity-80 rounded-lg transition-colors border border-black/20 dark:border-white/20"
                  style={{
                    backgroundColor: item.ministry?.color
                      ? hexToLowSaturation(item.ministry.color)
                      : 'hsl(var(--card))'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.type === 'assignment' ? (
                          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <CheckSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate pl-5.5">
                        {item.subtitle}
                      </p>
                    </div>

                    {item.time && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {item.time}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Collapsed preview for mobile */}
      {!isExpanded && (
        <div className="md:hidden">
          <Card className="border border-black/20 dark:border-white/20 !ring-0 outline-none">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">
                {t('yourWeek.itemsThisWeek', { count: items.length })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('yourWeek.tapToExpand')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

function groupItemsByDay(items: WeekItem[], getLabelFn: (date: Date) => string): DayGroup[] {
  const groups: Map<string, DayGroup> = new Map()

  items.forEach((item) => {
    const dayStart = startOfDay(item.date)
    const key = dayStart.toISOString()

    if (!groups.has(key)) {
      groups.set(key, {
        label: getLabelFn(dayStart),
        date: dayStart,
        items: [],
      })
    }

    groups.get(key)!.items.push(item)
  })

  // Sort groups by date and items within each group by time
  return Array.from(groups.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.date.getTime() - b.date.getTime()),
    }))
}

// Convert hex color to low saturation background
function hexToLowSaturation(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  // Return a very light tint (10% opacity equivalent)
  return `rgba(${r}, ${g}, ${b}, 0.12)`
}
