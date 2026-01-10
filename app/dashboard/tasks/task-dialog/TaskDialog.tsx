'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTaskDialogState } from './useTaskDialogState'
import { TaskDialogFormFields } from './TaskDialogFormFields'
import type { TaskDialogProps } from './types'

export function TaskDialog({
  open,
  onClose,
  task,
  ministries,
  campuses,
  members,
  events,
  defaultEventId,
  defaultCampusId,
  weekStartsOn = 0,
  timeFormat,
}: TaskDialogProps) {
  const t = useTranslations('tasks')
  const state = useTaskDialogState({
    open,
    task,
    ministries,
    events,
    defaultEventId,
    defaultCampusId,
    onClose,
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={state.handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {state.isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {state.isEditing
                ? t('dialog.editDescription')
                : t('dialog.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <TaskDialogFormFields
            formState={state.formState}
            isEditing={state.isEditing}
            filteredMinistries={state.filteredMinistries}
            campuses={campuses}
            members={members}
            events={events}
            weekStartsOn={weekStartsOn}
            timeFormat={timeFormat}
            showMemberPicker={state.showMemberPicker}
            showEventPicker={state.showEventPicker}
            setTitle={state.setTitle}
            setDescription={state.setDescription}
            setDueDate={state.setDueDate}
            setAssignedTo={state.setAssignedTo}
            setPriority={state.setPriority}
            setStatus={state.setStatus}
            setEventId={state.setEventId}
            setMinistryId={state.setMinistryId}
            setCampusId={state.setCampusId}
            setShowMemberPicker={state.setShowMemberPicker}
            setShowEventPicker={state.setShowEventPicker}
          />

          <DialogFooter className="flex justify-end gap-3 pt-4 !bg-transparent !border-0 !mx-0 !mb-0 !p-0">
            <Button
              type="button"
              variant="outline-pill"
              onClick={() => onClose()}
              disabled={state.isLoading}
              className="!border-black dark:!border-white"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={state.isLoading}
              variant="outline-pill"
              className="!bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
            >
              {state.isLoading
                ? t('dialog.saving')
                : state.isEditing
                  ? t('dialog.saveChanges')
                  : t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
