'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Clock, MapPin, User, Music } from 'lucide-react'
import Link from 'next/link'

interface Location {
  id: string
  name: string
  address: string | null
}

interface Person {
  id: string
  first_name: string
  last_name: string
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
}

interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  sort_order: number
  song_key: string | null
  is_song_placeholder: boolean
  leader: Person | null
  ministry: Ministry | null
  song: Song | null
}

interface EventData {
  id: string
  title: string
  description: string | null
  event_type: string
  start_time: string
  end_time: string
  location: Location | null
  responsible_person: Person | null
  agenda_items: AgendaItem[]
}

interface AgendaPrintViewProps {
  event: EventData
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) {
    return `${mins} min`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatRunningTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export function AgendaPrintView({ event }: AgendaPrintViewProps) {
  const totalDuration = useMemo(() => {
    return event.agenda_items.reduce((sum, item) => sum + item.duration_seconds, 0)
  }, [event.agenda_items])

  // Calculate running times for each item
  const itemsWithRunningTime = useMemo(() => {
    let runningTotal = 0
    return event.agenda_items.map(item => {
      const startTime = runningTotal
      runningTotal += item.duration_seconds
      return { ...item, runningTimeStart: startTime }
    })
  }, [event.agenda_items])

  const eventDate = new Date(event.start_time)
  const eventTime = format(eventDate, 'h:mm a')
  const eventDateFormatted = format(eventDate, 'EEEE, MMMM d, yyyy')

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href={`/dashboard/events?event=${event.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <Button onClick={handlePrint} className="gap-2 !bg-brand hover:!bg-brand/90 !text-white">
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      {/* Print content */}
      <div className="max-w-lg mx-auto px-4 py-6 print:px-2 print:py-4 print:max-w-none">
        {/* Event Header */}
        <div className="mb-6 print:mb-4">
          <h1 className="text-2xl font-bold print:text-xl">{event.title}</h1>
          <div className="mt-2 space-y-1 text-gray-600 print:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{eventDateFormatted} at {eventTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{event.location.name}</span>
              </div>
            )}
            {event.responsible_person && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Led by {event.responsible_person.first_name} {event.responsible_person.last_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Duration Summary */}
        <div className="mb-4 py-2 px-3 bg-gray-100 rounded-lg print:bg-gray-200 print:rounded-none print:border-y print:border-gray-300">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">{event.agenda_items.length} items</span>
            <span className="font-medium">Total: {formatRunningTime(totalDuration)}</span>
          </div>
        </div>

        {/* Agenda Items */}
        {event.agenda_items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No agenda items for this event
          </div>
        ) : (
          <div className="space-y-0">
            {itemsWithRunningTime.map((item, index) => {
              const isSong = !!item.song || item.is_song_placeholder
              const songKey = item.song_key || item.song?.default_key

              return (
                <div
                  key={item.id}
                  className="border-b border-gray-200 py-3 print:py-2 last:border-b-0"
                >
                  <div className="flex gap-3">
                    {/* Index/Icon */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {isSong ? (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center print:bg-purple-200">
                          <Music className="w-4 h-4 text-purple-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 print:bg-gray-200">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Duration Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 print:text-sm">
                            {item.song ? item.song.title : item.title}
                            {songKey && (
                              <span className="ml-2 text-sm font-normal text-purple-600 print:text-purple-700">
                                ({songKey})
                              </span>
                            )}
                          </h3>
                          {item.song?.artist && (
                            <p className="text-sm text-gray-500 print:text-xs">
                              {item.song.artist}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-sm font-medium text-gray-700 print:text-xs">
                            {formatDuration(item.duration_seconds)}
                          </span>
                          <div className="text-xs text-gray-400">
                            @{formatRunningTime(item.runningTimeStart)}
                          </div>
                        </div>
                      </div>

                      {/* Meta Row */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 print:text-xs">
                        {item.leader && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.leader.first_name} {item.leader.last_name}
                          </span>
                        )}
                        {item.ministry && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium print:border print:border-current"
                            style={{
                              backgroundColor: `${item.ministry.color}20`,
                              color: item.ministry.color,
                            }}
                          >
                            {item.ministry.name}
                          </span>
                        )}
                      </div>

                      {/* Notes/Description */}
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 px-2 py-1.5 rounded print:bg-gray-100 print:text-xs print:border print:border-gray-200">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer - print only */}
        <div className="hidden print:block mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
          Printed from Koinonia
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
