'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { VisibilityBadge } from '@/components/VisibilityBadge'
import { formatEventDateTime } from '@/lib/utils/format'
import type { EventDetail } from './types'

interface EventHeaderProps {
  selectedEvent: EventDetail
  canManage: boolean
  canDelete: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export const EventHeader = memo(function EventHeader({
  selectedEvent,
  canManage,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}: EventHeaderProps) {
  return (
    <div className="px-6 pt-4 pb-2 border-b">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedEvent.title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <EventTypeBadge type={selectedEvent.event_type} className="py-1" />
            {selectedEvent.visibility && selectedEvent.visibility !== 'members' && (
              <VisibilityBadge visibility={selectedEvent.visibility} className="py-1" />
            )}
          </div>
          {selectedEvent.description && (
            <p className="text-muted-foreground mt-1">{selectedEvent.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={onEdit}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-red-600 hover:text-red-700"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {formatEventDateTime(selectedEvent.start_time, selectedEvent.end_time, selectedEvent.is_all_day).date}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {formatEventDateTime(selectedEvent.start_time, selectedEvent.end_time, selectedEvent.is_all_day).time}
        </div>
        {selectedEvent.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {selectedEvent.location.name}
          </div>
        )}
        {selectedEvent.responsible_person && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {selectedEvent.responsible_person.first_name} {selectedEvent.responsible_person.last_name}
          </div>
        )}
      </div>
    </div>
  )
})
