'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAgendaItemPickerState } from './useAgendaItemPickerState'
import { AgendaItemPickerList } from './AgendaItemPickerList'
import { AgendaItemPickerCreateForm } from './AgendaItemPickerCreateForm'
import type { AgendaItemPickerProps } from './types'

export function AgendaItemPicker({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: AgendaItemPickerProps) {
  const state = useAgendaItemPickerState({
    open,
    eventId,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-zinc-950 max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {state.isCreatingNew ? 'Create New Agenda Item' : 'Add Agenda Item'}
          </DialogTitle>
          <DialogDescription>
            {state.isCreatingNew
              ? 'Create a new reusable agenda item for your church.'
              : 'Select an existing agenda item or search to create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {state.error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {state.error}
          </div>
        )}

        {state.isCreatingNew ? (
          <AgendaItemPickerCreateForm
            formState={state.createFormState}
            ministries={state.ministries}
            isAdding={state.isAdding}
            onTitleChange={state.setNewTitle}
            onMinistryChange={state.setNewMinistryId}
            onMinutesChange={state.handleMinutesChange}
            onSecondsChange={state.handleSecondsChange}
            onCreateAndAdd={state.handleCreateAndAdd}
            onBack={state.handleBackToList}
          />
        ) : (
          <AgendaItemPickerList
            presets={state.filteredPresets}
            searchQuery={state.searchQuery}
            showCreateOption={state.showCreateOption}
            isLoading={state.isLoading}
            isAdding={state.isAdding}
            onSearchChange={state.setSearchQuery}
            onSelectPreset={state.handleSelectPreset}
            onStartCreateNew={state.handleStartCreateNew}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
