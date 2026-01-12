'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarIcon, CalendarOff, ChevronRight, Plus, Pencil, Trash2, Cake, Gift } from 'lucide-react'
import { format } from 'date-fns'
import { getDateTimeFormatPattern, toDateString, parseDateString, formatDateRange } from '@/lib/utils/format'
import { getBirthdayDisplay } from '@/lib/utils/birthday-helpers'
import { cn } from '@/lib/utils'
import type { DashboardEvent, Birthday } from '@/app/dashboard/actions'
import { getMyUnavailability, deleteUnavailability } from '@/app/dashboard/availability/actions'
import { toast } from 'sonner'
import { AddUnavailabilityDialog } from './quick-access/AddUnavailabilityDialog'
import { EditUnavailabilityDialog } from './quick-access/EditUnavailabilityDialog'
import type { UnavailabilityItem } from './quick-access/types'

interface QuickAccessSectionProps {
  events: DashboardEvent[]
  birthdays?: Birthday[]
  unavailabilityCount?: number
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat?: '12h' | '24h'
}

// Check if date is upcoming
const isUpcoming = (endDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return endDate >= today
}

// Get initials from name
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function QuickAccessSection({ events, birthdays = [], unavailabilityCount = 0, weekStartsOn = 1, timeFormat = '24h' }: QuickAccessSectionProps) {
  const router = useRouter()
  const t = useTranslations('dashboard')

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UnavailabilityItem | null>(null)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])
  const [unavailabilityList, setUnavailabilityList] = useState<UnavailabilityItem[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load existing unavailability on mount
  const loadUnavailability = useCallback(async () => {
    const result = await getMyUnavailability()
    if (result.data) {
      // Store full list for display
      setUnavailabilityList(result.data)

      // Extract dates for calendar highlighting
      const dates: Date[] = []
      result.data.forEach((item) => {
        const start = parseDateString(item.start_date)
        const end = parseDateString(item.end_date)
        const current = new Date(start)
        while (current <= end) {
          dates.push(new Date(current))
          current.setDate(current.getDate() + 1)
        }
      })
      setUnavailableDates(dates)
    }
    setIsLoadingList(false)
  }, [])

  // Load on mount
  useEffect(() => {
    loadUnavailability()
  }, [loadUnavailability])

  // Get upcoming items only
  const upcomingItems = useMemo(() =>
    unavailabilityList.filter((item) => isUpcoming(item.end_date)),
    [unavailabilityList]
  )

  const handleOpenAddDialog = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setAddDialogOpen(true)
  }, [])

  const handleOpenEditDialog = useCallback((item: UnavailabilityItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingItem(item)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsDeleting(true)
    const result = await deleteUnavailability(id)

    if (result.success) {
      toast.success(t('quickAccess.unavailabilityDeleted'))
      loadUnavailability()
      router.refresh()
    } else {
      toast.error(t('quickAccess.failedToDelete'))
    }
    setIsDeleting(false)
  }, [loadUnavailability, router, t])

  const handleDialogSuccess = useCallback(() => {
    loadUnavailability()
  }, [loadUnavailability])

  const showBirthdays = birthdays.length > 0
  const gridCols = showBirthdays ? 'md:grid-cols-3' : 'md:grid-cols-2'

  return (
    <section className="mb-6">
      <h2 className="text-base md:text-lg font-semibold mb-3">{t('quickAccess.title')}</h2>

      <div className={cn('grid grid-cols-1 gap-4', gridCols)}>
        {/* Upcoming Events Card */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border border-border"
          onClick={() => router.push('/dashboard/events')}
        >
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {t('quickAccess.upcomingEvents')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('quickAccess.noUpcomingEvents')}</p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{format(new Date(event.start_time), getDateTimeFormatPattern(timeFormat))}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {events.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('quickAccess.moreEvents', { count: events.length - 3 })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays Card */}
        {showBirthdays && (
          <Card className="border border-border">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  {t('birthdays.title')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              <div className="space-y-2">
                {birthdays.slice(0, 3).map((birthday) => {
                  const { monthDay, daysUntil, label } = getBirthdayDisplay(birthday.dateOfBirth)
                  const isToday = daysUntil === 0
                  const isSoon = daysUntil > 0 && daysUntil <= 3

                  return (
                    <div
                      key={birthday.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md border',
                        isToday && 'bg-brand/10 border-brand',
                        isSoon && !isToday && 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={birthday.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(birthday.firstName, birthday.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium truncate">
                            {birthday.firstName} {birthday.lastName}
                          </p>
                          {isToday && <Gift className="h-3 w-3 text-brand animate-bounce" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{monthDay}</span>
                          <span>·</span>
                          <span className={cn(
                            isToday && 'text-brand font-medium',
                            isSoon && !isToday && 'text-amber-600 dark:text-amber-400 font-medium'
                          )}>
                            {label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {birthdays.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('birthdays.showMore', { count: birthdays.length - 3 })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unavailability Card */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border border-border"
          onClick={() => router.push('/dashboard/availability')}
        >
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
                {t('quickAccess.myUnavailability')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            {isLoadingList ? (
              <p className="text-sm text-muted-foreground">{t('quickAccess.loading')}</p>
            ) : upcomingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('quickAccess.noUpcomingUnavailable')}</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {formatDateRange(item.start_date, item.end_date)}
                      </div>
                      {item.reason && (
                        <div className="text-xs text-muted-foreground truncate">{item.reason}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleOpenEditDialog(item, e)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {upcomingItems.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {t('quickAccess.more', { count: upcomingItems.length - 3 })}
                  </p>
                )}
              </div>
            )}
            <Button
              size="sm"
              className="mt-3 text-xs gap-1.5 rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
              onClick={handleOpenAddDialog}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('quickAccess.addUnavailability')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Unavailability Dialog */}
      <AddUnavailabilityDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        unavailableDates={unavailableDates}
        weekStartsOn={weekStartsOn}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Unavailability Dialog */}
      <EditUnavailabilityDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        weekStartsOn={weekStartsOn}
        onSuccess={handleDialogSuccess}
      />
    </section>
  )
}
