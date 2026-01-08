'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cake, ChevronDown, ChevronUp, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBirthdayDisplay } from '@/lib/utils/birthday-helpers'
import type { Birthday } from '@/app/dashboard/actions'

interface BirthdaysSectionProps {
  birthdays: Birthday[]
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function BirthdayCard({ birthday }: { birthday: Birthday }) {
  const { monthDay, daysUntil, label } = getBirthdayDisplay(birthday.dateOfBirth)

  const isToday = daysUntil === 0
  const isPast = daysUntil < 0
  const isSoon = daysUntil > 0 && daysUntil <= 3

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isToday && 'bg-brand/10 border-brand',
        isSoon && !isToday && 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
        isPast && 'opacity-75'
      )}
    >
      <Avatar className="h-10 w-10 md:h-12 md:w-12">
        <AvatarImage src={birthday.avatarUrl || undefined} alt={`${birthday.firstName} ${birthday.lastName}`} />
        <AvatarFallback className="text-sm">
          {getInitials(birthday.firstName, birthday.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">
            {birthday.firstName} {birthday.lastName}
          </h4>
          {isToday && (
            <Gift className="h-4 w-4 text-brand animate-bounce" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground">{monthDay}</span>
          <span className="text-xs text-muted-foreground">-</span>
          <span
            className={cn(
              'text-xs font-medium',
              isToday && 'text-brand',
              isSoon && !isToday && 'text-amber-600 dark:text-amber-400',
              isPast && 'text-muted-foreground'
            )}
          >
            {label}
          </span>
        </div>

        {birthday.ministryName && (
          <Badge
            variant="outline"
            className="mt-1 text-xs"
            style={{
              borderColor: birthday.ministryColor || undefined,
              color: birthday.ministryColor || undefined,
            }}
          >
            {birthday.ministryName}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function BirthdaysSection({ birthdays }: BirthdaysSectionProps) {
  const [expanded, setExpanded] = useState(false)

  if (birthdays.length === 0) {
    return null
  }

  const INITIAL_DISPLAY_COUNT = 3
  const hasMore = birthdays.length > INITIAL_DISPLAY_COUNT
  const displayedBirthdays = expanded ? birthdays : birthdays.slice(0, INITIAL_DISPLAY_COUNT)

  // Count upcoming vs past
  const upcomingCount = birthdays.filter((b) => {
    const { daysUntil } = getBirthdayDisplay(b.dateOfBirth)
    return daysUntil >= 0
  }).length

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            <span>Upcoming Birthdays</span>
            <Badge variant="secondary" className="ml-1">
              {upcomingCount}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedBirthdays.map((birthday) => (
          <BirthdayCard key={birthday.id} birthday={birthday} />
        ))}

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {birthdays.length - INITIAL_DISPLAY_COUNT} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
