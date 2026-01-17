'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { User, CalendarDays } from 'lucide-react'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { TaskStatusBadge, TaskPriorityBadge } from '@/app/dashboard/tasks/components/TaskBadges'
import { MemberPicker } from '@/app/dashboard/tasks/components/MemberPicker'
import { EventPicker } from '@/app/dashboard/tasks/components/event-picker'
import type { Task, Person, TaskMinistry, TaskCampus, TaskHandlers } from './types'

interface TaskDetailsTabProps {
  task: Task
  members: Person[]
  ministries: TaskMinistry[]
  campuses: TaskCampus[]
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  descriptionValue: string
  onDescriptionChange: (value: string) => void
  handlers: TaskHandlers
}

export function TaskDetailsTab({
  task,
  members,
  ministries,
  campuses,
  weekStartsOn,
  descriptionValue,
  onDescriptionChange,
  handlers,
}: TaskDetailsTabProps) {
  const t = useTranslations('tasks.details')
  const locale = useLocale()
  const dateLocale = locale === 'pl' ? pl : enUS
  const [showMemberPicker, setShowMemberPicker] = useState(false)
  const [showEventPicker, setShowEventPicker] = useState(false)

  // Separate edit capabilities - each field checks its own requirements
  const canEditAssignee = members.length > 0
  const canEditMinistry = ministries.length > 0
  const canEditCampus = campuses.length > 0

  return (
    <div className="mt-2 space-y-4">
      {/* Two-column grid for main properties */}
      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t('labels.status')}</label>
          <Select value={task.status} onValueChange={handlers.handleStatusChange}>
            <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 h-9">
              <SelectValue>
                <TaskStatusBadge status={task.status} size="sm" />
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20">
              <SelectItem value="pending" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskStatusBadge status="pending" />
              </SelectItem>
              <SelectItem value="in_progress" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskStatusBadge status="in_progress" />
              </SelectItem>
              <SelectItem value="completed" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskStatusBadge status="completed" />
              </SelectItem>
              <SelectItem value="cancelled" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskStatusBadge status="cancelled" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t('labels.priority')}</label>
          <Select value={task.priority} onValueChange={handlers.handlePriorityChange}>
            <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 h-9">
              <SelectValue>
                <TaskPriorityBadge priority={task.priority} size="sm" />
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20">
              <SelectItem value="low" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskPriorityBadge priority="low" />
              </SelectItem>
              <SelectItem value="medium" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskPriorityBadge priority="medium" />
              </SelectItem>
              <SelectItem value="high" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskPriorityBadge priority="high" />
              </SelectItem>
              <SelectItem value="urgent" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                <TaskPriorityBadge priority="urgent" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ministry */}
        {canEditMinistry ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.ministry')}</label>
            <Select
              value={task.ministry_id || 'none'}
              onValueChange={(value) => handlers.handleMinistryChange(value === 'none' ? null : value)}
            >
              <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 h-9">
                <SelectValue>
                  {task.ministry ? (
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs"
                      style={{ borderColor: task.ministry.color, color: task.ministry.color }}
                    >
                      {task.ministry.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">{t('values.none')}</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20">
                <SelectItem value="none" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                  <span className="text-muted-foreground">{t('values.noMinistry')}</span>
                </SelectItem>
                {ministries.map((ministry) => (
                  <SelectItem
                    key={ministry.id}
                    value={ministry.id}
                    className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ministry.color }}
                      />
                      {ministry.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : task.ministry && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.ministry')}</label>
            <div className="flex items-center gap-2 h-9 px-3 border border-black/20 dark:border-white/20 rounded-md bg-muted/30">
              <Badge
                variant="outline"
                className="rounded-full text-xs"
                style={{ borderColor: task.ministry.color, color: task.ministry.color }}
              >
                {task.ministry.name}
              </Badge>
            </div>
          </div>
        )}

        {/* Campus */}
        {canEditCampus ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.campus')}</label>
            <Select
              value={task.campus_id || 'none'}
              onValueChange={(value) => handlers.handleCampusChange(value === 'none' ? null : value)}
            >
              <SelectTrigger centered className="w-full bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 h-9">
                <SelectValue>
                  {task.campus ? (
                    <Badge
                      variant="outline"
                      className="rounded-full text-xs"
                      style={task.campus.color ? { borderColor: task.campus.color, color: task.campus.color } : undefined}
                    >
                      {task.campus.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">{t('values.none')}</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20">
                <SelectItem value="none" className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50">
                  <span className="text-muted-foreground">{t('values.noCampus')}</span>
                </SelectItem>
                {campuses.map((campus) => (
                  <SelectItem
                    key={campus.id}
                    value={campus.id}
                    className="cursor-pointer hover:!bg-gray-50 dark:hover:!bg-zinc-800/50"
                  >
                    <span className="flex items-center gap-2">
                      {campus.color && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: campus.color }}
                        />
                      )}
                      {campus.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : task.campus && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.campus')}</label>
            <div className="flex items-center gap-2 h-9 px-3 border border-black/20 dark:border-white/20 rounded-md bg-muted/30">
              <Badge
                variant="outline"
                className="rounded-full text-xs"
                style={task.campus.color ? { borderColor: task.campus.color, color: task.campus.color } : undefined}
              >
                {task.campus.name}
              </Badge>
            </div>
          </div>
        )}

        {/* Assignee */}
        {canEditAssignee ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.assignedTo')}</label>
            <Button
              variant="outline"
              className="w-full justify-center bg-white dark:bg-zinc-950 !border-[1px] !border-black/20 dark:!border-white/20 rounded-md h-9 px-2 font-normal text-sm"
              onClick={() => setShowMemberPicker(true)}
            >
              <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {task.assignee
                ? <span className="truncate">{task.assignee.first_name} {task.assignee.last_name}</span>
                : <span className="text-muted-foreground">{t('values.none')}</span>}
            </Button>
            <MemberPicker
              open={showMemberPicker}
              onOpenChange={setShowMemberPicker}
              members={members}
              currentAssigneeId={task.assigned_to}
              onSelect={handlers.handleAssigneeChange}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t('labels.assignedTo')}</label>
            <div className="flex items-center gap-2 h-9 px-3 border border-black/20 dark:border-white/20 rounded-md bg-muted/30">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {task.assignee
                  ? `${task.assignee.first_name} ${task.assignee.last_name}`
                  : <span className="text-muted-foreground">{t('values.unassigned')}</span>}
              </span>
            </div>
          </div>
        )}

        {/* Due Date - always editable */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t('labels.dueDate')}</label>
          <DatePicker
            value={task.due_date ? format(parseISO(task.due_date), 'yyyy-MM-dd') : undefined}
            onChange={(value) => handlers.handleDueDateChange(value ? parseISO(value) : undefined)}
            placeholder={t('placeholder.noDueDate')}
            weekStartsOn={weekStartsOn}
            className="h-9 !border-black/20 dark:!border-white/20 text-sm"
          />
        </div>
      </div>

      {/* Event - full width */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{t('labels.linkedEvent')}</label>
        <Button
          variant="outline"
          className="w-full justify-start bg-white dark:bg-zinc-950 !border !border-black/20 dark:!border-white/20 rounded-full h-10 px-3 font-normal"
          onClick={() => setShowEventPicker(true)}
        >
          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
          {task.event
            ? <span className="truncate">{task.event.title} <span className="text-muted-foreground">({format(parseISO(task.event.start_time), 'MMM d, yyyy', { locale: dateLocale })})</span></span>
            : <span className="text-muted-foreground">{t('values.noEvent')}</span>}
        </Button>
        <EventPicker
          open={showEventPicker}
          onOpenChange={setShowEventPicker}
          currentEventId={task.event_id}
          onSelect={handlers.handleEventChange}
          weekStartsOn={weekStartsOn}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{t('labels.description')}</label>
        <Textarea
          value={descriptionValue}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={handlers.handleDescriptionBlur}
          placeholder={t('placeholder.addDescription')}
          rows={3}
          className="resize-none !border-black/20 dark:!border-white/20"
        />
      </div>

      {/* Created info */}
      <div className="border-t border-black/20 dark:border-white/20 -mx-6 mt-4" />
      <div className="pt-4 text-xs text-muted-foreground">
        {task.created_by_profile
          ? t('createdBy', {
              name: `${task.created_by_profile.first_name} ${task.created_by_profile.last_name}`,
              time: formatDistanceToNow(parseISO(task.created_at), { addSuffix: true, locale: dateLocale })
            })
          : t('createdAt', {
              time: formatDistanceToNow(parseISO(task.created_at), { addSuffix: true, locale: dateLocale })
            })}
      </div>
    </div>
  )
}
