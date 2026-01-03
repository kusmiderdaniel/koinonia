'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Clock,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  CalendarPlus,
  Copy,
} from 'lucide-react'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { VisibilityBadge } from '@/components/VisibilityBadge'
import { formatTimeString, formatDurationMinutes } from '@/lib/utils/format'
import type { TemplateHeaderProps } from './types'

export const TemplateHeader = memo(function TemplateHeader({
  template,
  canManage,
  canDelete,
  isDuplicating,
  onEdit,
  onDelete,
  onClose,
  onDuplicate,
  onCreateEvent,
}: TemplateHeaderProps) {
  return (
    <div className="px-6 pt-3 pb-4 border-b flex-shrink-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold truncate">{template.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <EventTypeBadge type={template.event_type} />
            <VisibilityBadge visibility={template.visibility} />
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimeString(template.default_start_time)}</span>
              <span>•</span>
              <span>{formatDurationMinutes(template.default_duration_minutes)}</span>
            </div>
            {template.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{template.location.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline-pill"
            size="sm"
            className="!border !border-gray-300 dark:!border-zinc-600"
            onClick={onCreateEvent}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
                  <Copy className="w-4 h-4 mr-2" />
                  {isDuplicating ? 'Duplicating...' : 'Duplicate Template'}
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Template
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})
