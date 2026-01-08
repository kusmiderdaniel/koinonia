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
  ArrowLeft,
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
import { useIsMobile } from '@/lib/hooks'
import { formatTime, formatDurationMinutes } from '@/lib/utils/format'
import type { TemplateHeaderProps } from './types'

export const TemplateHeader = memo(function TemplateHeader({
  template,
  canManage,
  canDelete,
  isDuplicating,
  timeFormat,
  onEdit,
  onDelete,
  onClose,
  onDuplicate,
  onCreateEvent,
}: TemplateHeaderProps) {
  const isMobile = useIsMobile()

  // Mobile: Compact header
  if (isMobile) {
    return (
      <div className="px-3 py-2 border-b flex-shrink-0 space-y-1">
        {/* Row 1: Back + Title + Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0 -ml-2" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-base font-semibold flex-1 truncate">{template.name}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={onCreateEvent}
            >
              <CalendarPlus className="w-4 h-4" />
            </Button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
                    <Copy className="w-4 h-4 mr-2" />
                    {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {/* Row 2: Type + Time inline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
          <EventTypeBadge type={template.event_type} size="sm" />
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(template.default_start_time, timeFormat)} • {formatDurationMinutes(template.default_duration_minutes)}
          </span>
        </div>
      </div>
    )
  }

  // Desktop: Full header
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
              <span>{formatTime(template.default_start_time, timeFormat)}</span>
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
            className="!border !border-black dark:!border-white"
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
