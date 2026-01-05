import { useState, useEffect, useCallback } from 'react'
import { createEventTemplate, updateEventTemplate, getCampuses } from '../actions'
import { getChurchMembers } from '../../actions'
import type { Template, Location, Person, Campus, TemplateFormData } from './types'
import { parseTime } from './types'

interface UseTemplateDialogStateOptions {
  open: boolean
  template: Template | null
  onSuccess: () => void
}

const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  description: '',
  eventType: 'service',
  selectedLocation: null,
  selectedResponsiblePerson: null,
  campusId: null,
  defaultStartTime: '09:00',
  defaultDurationMinutes: 120,
  visibility: 'members',
}

export function useTemplateDialogState({ open, template, onSuccess }: UseTemplateDialogStateOptions) {
  // Form data
  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA)

  // Reference data
  const [churchMembers, setChurchMembers] = useState<Person[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])

  // UI state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [responsiblePersonPickerOpen, setResponsiblePersonPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      getChurchMembers().then((result) => {
        if (result.data) {
          setChurchMembers(result.data as Person[])
        }
      })
      getCampuses().then((result) => {
        if (result.data) {
          setCampuses(result.data)
        }
      })

      if (template) {
        setFormData({
          name: template.name,
          description: template.description || '',
          eventType: template.event_type,
          selectedLocation: template.location || null,
          selectedResponsiblePerson: template.responsible_person || null,
          campusId: template.campus_id || null,
          defaultStartTime: parseTime(template.default_start_time),
          defaultDurationMinutes: template.default_duration_minutes,
          visibility: template.visibility,
        })
      } else {
        setFormData(DEFAULT_FORM_DATA)
      }
      setError(null)
    }
  }, [open, template])

  // Field update helpers
  const updateField = useCallback(<K extends keyof TemplateFormData>(
    field: K,
    value: TemplateFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleCampusChange = useCallback((newCampusId: string | null) => {
    setFormData(prev => {
      const newData = { ...prev, campusId: newCampusId }
      // Clear location if it doesn't match the new campus
      if (prev.selectedLocation?.campus_id) {
        if (newCampusId && prev.selectedLocation.campus_id !== newCampusId) {
          newData.selectedLocation = null
        }
      }
      return newData
    })
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      eventType: formData.eventType as 'service' | 'rehearsal' | 'meeting' | 'special_event' | 'other',
      locationId: formData.selectedLocation?.id || null,
      responsiblePersonId: formData.selectedResponsiblePerson?.id || null,
      defaultStartTime: formData.defaultStartTime,
      defaultDurationMinutes: formData.defaultDurationMinutes,
      visibility: formData.visibility as 'members' | 'volunteers' | 'leaders' | 'hidden',
      campusId: formData.campusId,
    }

    const result = template
      ? await updateEventTemplate(template.id, data)
      : await createEventTemplate(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onSuccess()
    }
  }, [formData, template, onSuccess])

  return {
    // Form data
    formData,
    updateField,

    // Reference data
    churchMembers,
    campuses,

    // Pickers
    locationPickerOpen,
    setLocationPickerOpen,
    responsiblePersonPickerOpen,
    setResponsiblePersonPickerOpen,

    // Handlers
    handleCampusChange,
    handleSubmit,

    // State
    isLoading,
    error,
    isEditing: !!template,
  }
}
