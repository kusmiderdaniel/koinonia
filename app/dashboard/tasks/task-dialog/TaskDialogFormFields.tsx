'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { MemberPicker } from '../components/MemberPicker'
import { EventPicker } from '../components/event-picker'
import type {
  TaskMinistry,
  TaskCampus,
  Person,
  TaskPriority,
  TaskStatus,
  TaskFormState,
} from './types'

const SELECT_ITEM_CLASS =
  'cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium'

interface TaskDialogFormFieldsProps {
  formState: TaskFormState
  isEditing: boolean
  filteredMinistries: TaskMinistry[]
  campuses: TaskCampus[]
  members: Person[]
  events: { id: string; title: string; start_time: string }[]
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  timeFormat?: '12h' | '24h'
  showMemberPicker: boolean
  showEventPicker: boolean
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setDueDate: (value: string) => void
  setAssignedTo: (value: string) => void
  setPriority: (value: TaskPriority) => void
  setStatus: (value: TaskStatus) => void
  setEventId: (value: string) => void
  setMinistryId: (value: string) => void
  setCampusId: (value: string) => void
  setShowMemberPicker: (value: boolean) => void
  setShowEventPicker: (value: boolean) => void
}

export function TaskDialogFormFields({
  formState,
  isEditing,
  filteredMinistries,
  campuses,
  members,
  events,
  weekStartsOn,
  timeFormat,
  showMemberPicker,
  showEventPicker,
  setTitle,
  setDescription,
  setDueDate,
  setAssignedTo,
  setPriority,
  setStatus,
  setEventId,
  setMinistryId,
  setCampusId,
  setShowMemberPicker,
  setShowEventPicker,
}: TaskDialogFormFieldsProps) {
  const t = useTranslations('tasks')
  const selectedMember = formState.assignedTo
    ? members.find((m) => m.id === formState.assignedTo)
    : null
  const selectedEvent = formState.eventId
    ? events.find((e) => e.id === formState.eventId)
    : null

  return (
    <div className="grid gap-4 py-4">
      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="title">{t('dialog.titleLabel')}</Label>
        <Input
          id="title"
          value={formState.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('dialog.titlePlaceholder')}
          autoFocus
        />
      </div>

      {/* Status (only show when editing) */}
      {isEditing && (
        <div className="grid gap-2">
          <Label>{t('dialog.statusLabel')}</Label>
          <Select
            value={formState.status}
            onValueChange={(v) => setStatus(v as TaskStatus)}
          >
            <SelectTrigger
              centered
              className="w-full h-10 bg-white dark:bg-zinc-950 !border !border-black dark:!border-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
              <SelectItem value="pending" className={SELECT_ITEM_CLASS}>
                {t('status.pending')}
              </SelectItem>
              <SelectItem value="in_progress" className={SELECT_ITEM_CLASS}>
                {t('status.in_progress')}
              </SelectItem>
              <SelectItem value="completed" className={SELECT_ITEM_CLASS}>
                {t('status.completed')}
              </SelectItem>
              <SelectItem value="cancelled" className={SELECT_ITEM_CLASS}>
                {t('status.cancelled')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Row 1: Campus & Ministry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('dialog.campusLabel')}</Label>
          <Select
            value={formState.campusId || '_none'}
            onValueChange={(v) => setCampusId(v === '_none' ? '' : v)}
          >
            <SelectTrigger
              centered
              className="w-full h-10 bg-white dark:bg-zinc-950 !border !border-black dark:!border-white"
            >
              <SelectValue placeholder={t('dialog.none')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
              <SelectItem value="_none" className={SELECT_ITEM_CLASS}>
                {t('dialog.none')}
              </SelectItem>
              {campuses.map((campus) => (
                <SelectItem
                  key={campus.id}
                  value={campus.id}
                  className={SELECT_ITEM_CLASS}
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
        <div className="grid gap-2">
          <Label>{t('dialog.ministryLabel')}</Label>
          <Select
            value={formState.ministryId || '_none'}
            onValueChange={(v) => setMinistryId(v === '_none' ? '' : v)}
          >
            <SelectTrigger
              centered
              className="w-full h-10 bg-white dark:bg-zinc-950 !border !border-black dark:!border-white"
            >
              <SelectValue placeholder={t('dialog.none')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
              <SelectItem value="_none" className={SELECT_ITEM_CLASS}>
                {t('dialog.none')}
              </SelectItem>
              {filteredMinistries.map((ministry) => (
                <SelectItem
                  key={ministry.id}
                  value={ministry.id}
                  className={SELECT_ITEM_CLASS}
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
      </div>

      {/* Row 2: Due Date & Assignment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('dialog.dueDateLabel')}</Label>
          <DatePicker
            value={formState.dueDate}
            onChange={setDueDate}
            placeholder={t('dates.pickDate')}
            weekStartsOn={weekStartsOn}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('dialog.assignToLabel')}</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center bg-white dark:bg-zinc-950 !border !border-black dark:!border-white font-normal h-10"
            onClick={() => setShowMemberPicker(true)}
          >
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            {selectedMember ? (
              `${selectedMember.first_name} ${selectedMember.last_name}`
            ) : (
              <span className="text-muted-foreground">{t('dialog.selectPerson')}</span>
            )}
          </Button>
          <MemberPicker
            open={showMemberPicker}
            onOpenChange={setShowMemberPicker}
            members={members}
            currentAssigneeId={formState.assignedTo || null}
            onSelect={(id) => setAssignedTo(id || '')}
          />
        </div>
      </div>

      {/* Row 3: Link to Event & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t('dialog.linkToEventLabel')}</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center bg-white dark:bg-zinc-950 !border !border-black dark:!border-white font-normal h-10"
            onClick={() => setShowEventPicker(true)}
          >
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            {selectedEvent ? (
              <span className="truncate">{selectedEvent.title}</span>
            ) : (
              <span className="text-muted-foreground">{t('dialog.none')}</span>
            )}
          </Button>
          <EventPicker
            open={showEventPicker}
            onOpenChange={setShowEventPicker}
            currentEventId={formState.eventId || null}
            onSelect={(id) => setEventId(id || '')}
            weekStartsOn={weekStartsOn}
            timeFormat={timeFormat}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t('dialog.priorityLabel')}</Label>
          <Select
            value={formState.priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
          >
            <SelectTrigger
              centered
              className="w-full h-10 bg-white dark:bg-zinc-950 !border !border-black dark:!border-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border border-input">
              <SelectItem value="low" className={SELECT_ITEM_CLASS}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  {t('priority.low')}
                </span>
              </SelectItem>
              <SelectItem value="medium" className={SELECT_ITEM_CLASS}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {t('priority.medium')}
                </span>
              </SelectItem>
              <SelectItem value="high" className={SELECT_ITEM_CLASS}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  {t('priority.high')}
                </span>
              </SelectItem>
              <SelectItem value="urgent" className={SELECT_ITEM_CLASS}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {t('priority.urgent')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">{t('dialog.descriptionLabel')}</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('dialog.descriptionPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  )
}
