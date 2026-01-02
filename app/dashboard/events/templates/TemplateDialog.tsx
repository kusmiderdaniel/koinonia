'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MapPin, X, Eye, Lock, User } from 'lucide-react'
import { createEventTemplate, updateEventTemplate, getCampuses } from './actions'
import { getChurchMembers } from '../actions'
import { LocationPicker } from '../location-picker'
import { ResponsiblePersonPicker } from '../responsible-person-picker'
import { SingleCampusPicker } from '@/components/CampusPicker'

interface Location {
  id: string
  name: string
  address: string | null
  campus_id?: string | null
}

interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface Campus {
  id: string
  name: string
  color: string
  is_default: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  responsible_person_id: string | null
  responsible_person: Person | null
  campus_id: string | null
  campus: { id: string; name: string; color: string } | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
}

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template | null
  onSuccess: () => void
}

const EVENT_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'special_event', label: 'Special Event' },
  { value: 'other', label: 'Other' },
]

const VISIBILITY_LEVELS = [
  { value: 'members', label: 'All Members', description: 'Visible to all church members' },
  { value: 'volunteers', label: 'Volunteers+', description: 'Visible to volunteers, leaders, and admins' },
  { value: 'leaders', label: 'Leaders+', description: 'Visible to leaders and admins only' },
  { value: 'hidden', label: 'Private', description: 'Only visible to invited users' },
]

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 150, label: '2.5 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
]

function parseTime(timeString: string): string {
  // Convert "09:00:00" to "09:00"
  return timeString.substring(0, 5)
}

export function TemplateDialog({ open, onOpenChange, template, onSuccess }: TemplateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('service')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [selectedResponsiblePerson, setSelectedResponsiblePerson] = useState<Person | null>(null)
  const [responsiblePersonPickerOpen, setResponsiblePersonPickerOpen] = useState(false)
  const [churchMembers, setChurchMembers] = useState<Person[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [campusId, setCampusId] = useState<string | null>(null)
  const [defaultStartTime, setDefaultStartTime] = useState('09:00')
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(120)
  const [visibility, setVisibility] = useState('members')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Load church members for responsible person picker
      getChurchMembers().then((result) => {
        if (result.data) {
          setChurchMembers(result.data as Person[])
        }
      })
      // Load campuses
      getCampuses().then((result) => {
        if (result.data) {
          setCampuses(result.data)
        }
      })

      if (template) {
        setName(template.name)
        setDescription(template.description || '')
        setEventType(template.event_type)
        setSelectedLocation(template.location || null)
        setSelectedResponsiblePerson(template.responsible_person || null)
        setDefaultStartTime(parseTime(template.default_start_time))
        setDefaultDurationMinutes(template.default_duration_minutes)
        setVisibility(template.visibility)
        setCampusId(template.campus_id || null)
      } else {
        setName('')
        setDescription('')
        setEventType('service')
        setSelectedLocation(null)
        setSelectedResponsiblePerson(null)
        setDefaultStartTime('09:00')
        setDefaultDurationMinutes(120)
        setVisibility('members')
        setCampusId(null)
      }
      setError(null)
    }
  }, [open, template])

  // Clear location if it's not available for the selected campus
  const handleCampusChange = (newCampusId: string | null) => {
    setCampusId(newCampusId)

    // If a location is selected and doesn't match the new campus, clear it
    if (selectedLocation && selectedLocation.campus_id) {
      if (newCampusId && selectedLocation.campus_id !== newCampusId) {
        setSelectedLocation(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = {
      name,
      description: description || undefined,
      eventType: eventType as 'service' | 'rehearsal' | 'meeting' | 'special_event' | 'other',
      locationId: selectedLocation?.id || null,
      responsiblePersonId: selectedResponsiblePerson?.id || null,
      defaultStartTime,
      defaultDurationMinutes,
      visibility: visibility as 'members' | 'volunteers' | 'leaders' | 'hidden',
      campusId: campusId,
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
  }

  const isEditing = !!template

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Morning Service"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                  {EVENT_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input [&_[data-description]]:hidden">
                  <div className="flex items-center gap-2">
                    {visibility === 'hidden' ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                  {VISIBILITY_LEVELS.map((v) => (
                    <SelectItem
                      key={v.value}
                      value={v.value}
                      textValue={v.label}
                      className="py-2 cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                    >
                      <div className="flex flex-col">
                        <span>{v.label}</span>
                        <span data-description className="text-xs text-muted-foreground font-normal">{v.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultStartTime">Default Start Time *</Label>
              <Input
                id="defaultStartTime"
                type="time"
                value={defaultStartTime}
                onChange={(e) => setDefaultStartTime(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={defaultDurationMinutes.toString()}
                onValueChange={(v) => setDefaultDurationMinutes(parseInt(v))}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value.toString()}
                      className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Template description..."
              rows={2}
            />
          </div>

          {campuses.length > 0 && (
            <div className="space-y-2">
              <Label>Campus</Label>
              <SingleCampusPicker
                campuses={campuses}
                selectedCampusId={campusId}
                onChange={handleCampusChange}
                placeholder="All campuses"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty for a church-wide template
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Default Location</Label>
            {selectedLocation ? (
              <div className="flex items-center gap-2 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-muted/50">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{selectedLocation.name}</div>
                  {selectedLocation.address && (
                    <div className="text-sm text-muted-foreground truncate">
                      {selectedLocation.address}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 rounded-full"
                  onClick={() => setSelectedLocation(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground rounded-lg !border !border-gray-300 dark:!border-zinc-700"
                onClick={() => setLocationPickerOpen(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Choose location...
              </Button>
            )}
          </div>

          <LocationPicker
            open={locationPickerOpen}
            onOpenChange={setLocationPickerOpen}
            selectedLocationId={selectedLocation?.id || null}
            onSelect={setSelectedLocation}
            filterByCampusIds={campusId ? [campusId] : []}
          />

          <div className="space-y-2">
            <Label>Responsible Person</Label>
            {selectedResponsiblePerson ? (
              <div className="flex items-center gap-2 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-muted/50">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {selectedResponsiblePerson.first_name} {selectedResponsiblePerson.last_name}
                  </div>
                  {selectedResponsiblePerson.email && (
                    <div className="text-sm text-muted-foreground truncate">
                      {selectedResponsiblePerson.email}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 rounded-full"
                  onClick={() => setSelectedResponsiblePerson(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground rounded-lg !border !border-gray-300 dark:!border-zinc-700"
                onClick={() => setResponsiblePersonPickerOpen(true)}
              >
                <User className="w-4 h-4 mr-2" />
                Choose responsible person...
              </Button>
            )}
          </div>

          <ResponsiblePersonPicker
            open={responsiblePersonPickerOpen}
            onOpenChange={setResponsiblePersonPickerOpen}
            selectedPersonId={selectedResponsiblePerson?.id || null}
            onSelect={(person) => setSelectedResponsiblePerson(person as Person | null)}
          />

          <DialogFooter className="flex justify-end gap-3 pt-4 !bg-transparent !border-0">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                ? 'Save Changes'
                : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
