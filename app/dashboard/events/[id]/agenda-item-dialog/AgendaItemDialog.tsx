'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAgendaItemDialogState } from './useAgendaItemDialogState'
import { AgendaItemDialogFormFields } from './AgendaItemDialogFormFields'
import type { AgendaItemDialogProps } from './types'

export function AgendaItemDialog({
  open,
  onOpenChange,
  eventId,
  item,
  onSuccess,
}: AgendaItemDialogProps) {
  const state = useAgendaItemDialogState({
    open,
    item,
    eventId,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-zinc-950 !border !border-black dark:!border-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state.isEditing ? 'Edit Agenda Item' : 'Add Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            {state.isEditing
              ? 'Update the agenda item details.'
              : 'Add a new item to the event agenda.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={state.handleSubmit}>
          <AgendaItemDialogFormFields
            formState={state.formState}
            isEditing={state.isEditing}
            ministries={state.ministries}
            members={state.members}
            presets={state.presets}
            isLoadingMembers={state.isLoadingMembers}
            error={state.error}
            setTitle={state.setTitle}
            setDescription={state.setDescription}
            setMinistryId={state.setMinistryId}
            setLeaderId={state.setLeaderId}
            handleMinutesChange={state.handleMinutesChange}
            handleSecondsChange={state.handleSecondsChange}
            handlePresetSelect={state.handlePresetSelect}
          />

          <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline-pill-muted"
              className="!border-0"
              onClick={() => onOpenChange(false)}
              disabled={state.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={state.isLoading || !state.formState.title.trim()}
              className="!rounded-lg !bg-brand hover:!bg-brand/90 !text-brand-foreground !px-4 !py-2 disabled:!opacity-50"
            >
              {state.isLoading
                ? 'Saving...'
                : state.isEditing
                  ? 'Save Changes'
                  : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
