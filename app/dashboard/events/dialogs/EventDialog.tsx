'use client'

import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/lib/hooks'
import { createEvent, updateEvent, getChurchMembers, getCampuses } from '../actions'
import { EventFormFields } from './EventFormFields'
import { formatDateTimeLocal, getDefaultStartTime, getDefaultEndTime } from './constants'
import type { EventDialogProps, Location, Person, CampusOption } from './types'

export const EventDialog = memo(function EventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
  timeFormat = '24h',
}: EventDialogProps) {
  const isMobile = useIsMobile()
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('service')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [selectedResponsiblePerson, setSelectedResponsiblePerson] = useState<Person | null>(null)
  const [responsiblePersonPickerOpen, setResponsiblePersonPickerOpen] = useState(false)
  const [churchMembers, setChurchMembers] = useState<Person[]>([])
  const [campuses, setCampuses] = useState<CampusOption[]>([])
  const [campusesLoading, setCampusesLoading] = useState(true)
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [visibility, setVisibility] = useState('members')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCampusesLoading(true)

      Promise.all([getChurchMembers(), getCampuses()]).then(
        ([membersResult, campusesResult]) => {
          if (membersResult.data) {
            setChurchMembers(membersResult.data as Person[])
          }
          if (campusesResult.data) {
            setCampuses(campusesResult.data)
            if (!event) {
              const defaultCampus = campusesResult.data.find((c) => c.is_default)
              if (defaultCampus) {
                setSelectedCampusIds([defaultCampus.id])
              }
            }
          }
          setCampusesLoading(false)
        }
      )

      if (event) {
        setTitle(event.title)
        setEventType(event.event_type)
        setSelectedLocation(event.location || null)
        setSelectedResponsiblePerson(event.responsible_person || null)
        setStartTime(formatDateTimeLocal(event.start_time))
        setEndTime(formatDateTimeLocal(event.end_time))
        setVisibility(event.visibility || 'members')
        setInvitedUsers(event.event_invitations?.map((inv) => inv.profile_id) || [])
        setSelectedCampusIds(event.campuses?.map((c) => c.id) || [])
      } else {
        setTitle('')
        setEventType('service')
        setSelectedLocation(null)
        setSelectedResponsiblePerson(null)
        setStartTime(getDefaultStartTime())
        setEndTime(getDefaultEndTime())
        setVisibility('members')
        setInvitedUsers([])
      }
      setError(null)
    }
  }, [open, event])

  const handleCampusChange = (newCampusIds: string[]) => {
    setSelectedCampusIds(newCampusIds)

    if (selectedLocation && selectedLocation.campus_id) {
      if (newCampusIds.length > 0 && !newCampusIds.includes(selectedLocation.campus_id)) {
        setSelectedLocation(null)
      }
    }
  }

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)

    if (newStartTime && endTime) {
      const start = new Date(newStartTime)
      const end = new Date(endTime)

      if (end <= start) {
        const newEnd = new Date(start)
        newEnd.setHours(newEnd.getHours() + 1)
        setEndTime(formatDateTimeLocal(newEnd.toISOString()))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const start = new Date(startTime)
    const end = new Date(endTime)
    if (end <= start) {
      setError('End time must be after start time')
      setIsLoading(false)
      return
    }

    const data = {
      title,
      eventType: eventType as 'service' | 'rehearsal' | 'meeting' | 'special_event' | 'other',
      locationId: selectedLocation?.id || null,
      responsiblePersonId: selectedResponsiblePerson?.id || null,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAllDay: false,
      status: 'published' as const,
      visibility: visibility as 'members' | 'volunteers' | 'leaders' | 'hidden',
      invitedUsers: visibility === 'hidden' ? invitedUsers : undefined,
      campusIds: selectedCampusIds,
    }

    const result = event ? await updateEvent(event.id, data) : await createEvent(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onSuccess()
    }
  }

  const isEditing = !!event

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-xl bg-white dark:bg-zinc-950 max-h-[100dvh] sm:max-h-[90vh] flex flex-col justify-start w-full sm:w-auto fixed inset-x-0 top-0 bottom-auto sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-lg overflow-x-hidden ${isMobile ? 'p-3 gap-1' : ''}`}>
        <DialogHeader className={isMobile ? 'gap-0' : ''}>
          <DialogTitle className={isMobile ? 'text-base' : ''}>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
          {!isMobile && (
            <DialogDescription>
              {isEditing
                ? 'Update the event details below.'
                : 'Add a new event to your church calendar.'}
            </DialogDescription>
          )}
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className={`overflow-y-auto overflow-x-hidden min-h-0 ${isMobile ? 'space-y-3' : 'space-y-4 flex-1'}`}
        >
          <EventFormFields
            title={title}
            setTitle={setTitle}
            eventType={eventType}
            setEventType={setEventType}
            visibility={visibility}
            setVisibility={setVisibility}
            campuses={campuses}
            campusesLoading={campusesLoading}
            selectedCampusIds={selectedCampusIds}
            onCampusChange={handleCampusChange}
            invitedUsers={invitedUsers}
            setInvitedUsers={setInvitedUsers}
            churchMembers={churchMembers}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            locationPickerOpen={locationPickerOpen}
            setLocationPickerOpen={setLocationPickerOpen}
            selectedResponsiblePerson={selectedResponsiblePerson}
            setSelectedResponsiblePerson={setSelectedResponsiblePerson}
            responsiblePersonPickerOpen={responsiblePersonPickerOpen}
            setResponsiblePersonPickerOpen={setResponsiblePersonPickerOpen}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={handleStartTimeChange}
            setEndTime={setEndTime}
            timeFormat={timeFormat}
            error={error}
          />

          <DialogFooter className={`flex justify-end gap-3 !bg-transparent !border-0 !mx-0 !p-0 ${isMobile ? '!mb-0 pt-2' : '!mb-0 pt-4'}`}>
            <Button
              type="button"
              variant="outline-pill"
              size={isMobile ? 'sm' : 'default'}
              className="!border !border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline-pill"
              size={isMobile ? 'sm' : 'default'}
              disabled={isLoading || !title.trim()}
              className="!border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
