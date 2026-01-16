'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarOff, Pencil, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { formatDateRange } from '../types'
import type { Unavailability } from '../types'

export interface UnavailabilityListProps {
  isLoading: boolean
  unavailability: Unavailability[]
  upcomingItems: Unavailability[]
  pastItems: Unavailability[]
  activeTab: string
  onTabChange: (tab: string) => void
  onEdit: (item: Unavailability) => void
  onDelete: (id: string) => void
}

export const UnavailabilityList = memo(function UnavailabilityList({
  isLoading,
  unavailability,
  upcomingItems,
  pastItems,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
}: UnavailabilityListProps) {
  const t = useTranslations('availability')

  if (isLoading) {
    return <LoadingState message={t('loading')} />
  }

  if (unavailability.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <CalendarOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{t('empty.title')}</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('empty.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full bg-muted/50 border border-black dark:border-white">
        <TabsTrigger
          value="upcoming"
          className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
        >
          {t('tabs.upcoming')}
        </TabsTrigger>
        <TabsTrigger
          value="past"
          className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
        >
          {t('tabs.past')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {upcomingItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('noUpcoming')}
          </div>
        ) : (
          <div className="space-y-1.5">
            {upcomingItems.map((item) => (
              <UnavailabilityItem
                key={item.id}
                item={item}
                isPast={false}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        {pastItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('noPast')}
          </div>
        ) : (
          <div className="space-y-1.5 opacity-70">
            {pastItems.map((item) => (
              <UnavailabilityItem
                key={item.id}
                item={item}
                isPast={true}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
})

// Single Unavailability Item Component
interface UnavailabilityItemProps {
  item: Unavailability
  isPast: boolean
  onEdit: (item: Unavailability) => void
  onDelete: (id: string) => void
}

const UnavailabilityItem = memo(function UnavailabilityItem({ item, isPast, onEdit, onDelete }: UnavailabilityItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">
          {formatDateRange(item.start_date, item.end_date)}
        </div>
        {item.reason && (
          <div className="text-xs text-muted-foreground truncate">{item.reason}</div>
        )}
      </div>
      <div className="flex items-center gap-0.5 ml-2">
        {!isPast && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)} aria-label="Edit unavailability">
            <Pencil className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)} aria-label="Delete unavailability">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  )
})
