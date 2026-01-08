'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, CalendarOff, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { getDateTimeFormatPattern, toDateString, parseDateString, formatDateRange } from '@/lib/utils/format'
import type { DashboardEvent } from '@/app/dashboard/actions'
import { getMyUnavailability, deleteUnavailability } from '@/app/dashboard/availability/actions'
import { toast } from 'sonner'
import { AddUnavailabilityDialog } from './quick-access/AddUnavailabilityDialog'
import { EditUnavailabilityDialog } from './quick-access/EditUnavailabilityDialog'
import type { UnavailabilityItem } from './quick-access/types'

interface QuickAccessSectionProps {
  events: DashboardEvent[]
  unavailabilityCount?: number
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat?: '12h' | '24h'
}

// Check if date is upcoming
const isUpcoming = (endDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return endDate >= today
}

export function QuickAccessSection({ events, unavailabilityCount = 0, weekStartsOn = 1, timeFormat = '24h' }: QuickAccessSectionProps) {
  const router = useRouter()

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
      toast.success('Unavailability deleted')
      loadUnavailability()
      router.refresh()
    } else {
      toast.error('Failed to delete')
    }
    setIsDeleting(false)
  }, [loadUnavailability, router])

  const handleDialogSuccess = useCallback(() => {
    loadUnavailability()
  }, [loadUnavailability])

  return (
    <section className="mb-6">
      <h2 className="text-base md:text-lg font-semibold mb-3">Quick Access</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Events Card */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border border-border"
          onClick={() => router.push('/dashboard/events')}
        >
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Upcoming Events
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
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
                    +{events.length - 3} more events
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unavailability Card */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border border-border"
          onClick={() => router.push('/dashboard/availability')}
        >
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
                My Unavailability
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4">
            {isLoadingList ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : upcomingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming unavailable dates</p>
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
                    +{upcomingItems.length - 3} more
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
              Add Unavailability
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
