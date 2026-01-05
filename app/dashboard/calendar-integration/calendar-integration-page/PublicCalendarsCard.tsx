'use client'

import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Campus } from './types'

interface PublicCalendarsCardProps {
  campuses: Campus[]
  copiedCampusId: string | null
  getPublicCalendarUrl: (campusId: string) => string
  getPublicWebcalUrl: (campusId: string) => string
  onCopy: (url: string, campusId: string) => void
}

export function PublicCalendarsCard({
  campuses,
  copiedCampusId,
  getPublicCalendarUrl,
  getPublicWebcalUrl,
  onCopy,
}: PublicCalendarsCardProps) {
  if (campuses.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Campus Calendars</CardTitle>
        <CardDescription>
          Subscribe to see all public events for a campus. Anyone can subscribe
          to these calendars.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {campuses.map((campus) => (
          <div
            key={campus.id}
            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {campus.color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: campus.color }}
                />
              )}
              <span className="font-medium truncate">{campus.name}</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onCopy(getPublicCalendarUrl(campus.id), campus.id)
                }
                className="gap-1"
              >
                {copiedCampusId === campus.id ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(getPublicWebcalUrl(campus.id), '_blank')
                }
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
