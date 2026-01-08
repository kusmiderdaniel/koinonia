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
import { LocationPicker } from '../../LocationPicker'
import { ResponsiblePersonPicker } from '../../ResponsiblePersonPicker'
import { useTemplateDialogState } from './useTemplateDialogState'
import { TemplateFormFields } from './TemplateFormFields'
import type { TemplateDialogProps, Person } from './types'

export function TemplateDialog({ open, onOpenChange, template, onSuccess, timeFormat }: TemplateDialogProps) {
  const {
    formData,
    updateField,
    churchMembers,
    campuses,
    locationPickerOpen,
    setLocationPickerOpen,
    responsiblePersonPickerOpen,
    setResponsiblePersonPickerOpen,
    handleCampusChange,
    handleSubmit,
    isLoading,
    error,
    isEditing,
  } = useTemplateDialogState({ open, template, onSuccess })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the template details below.'
              : 'Create a reusable event template.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <TemplateFormFields
            formData={formData}
            updateField={updateField}
            campuses={campuses}
            onCampusChange={handleCampusChange}
            onOpenLocationPicker={() => setLocationPickerOpen(true)}
            onOpenResponsiblePersonPicker={() => setResponsiblePersonPickerOpen(true)}
            timeFormat={timeFormat}
          />

          <LocationPicker
            open={locationPickerOpen}
            onOpenChange={setLocationPickerOpen}
            selectedLocationId={formData.selectedLocation?.id || null}
            onSelect={(location) => updateField('selectedLocation', location)}
            filterByCampusIds={formData.campusId ? [formData.campusId] : []}
          />

          <ResponsiblePersonPicker
            open={responsiblePersonPickerOpen}
            onOpenChange={setResponsiblePersonPickerOpen}
            selectedPersonId={formData.selectedResponsiblePerson?.id || null}
            onSelect={(person) => updateField('selectedResponsiblePerson', person as Person | null)}
          />

          <DialogFooter className="!flex-row gap-3 pt-4 !bg-transparent !border-0">
            <Button
              type="button"
              variant="outline-pill"
              className="flex-1 !border !border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline-pill"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 !border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                ? 'Save'
                : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
