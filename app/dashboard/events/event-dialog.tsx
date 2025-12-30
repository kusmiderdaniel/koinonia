'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { MapPin, X, User, Search, Eye, Lock, Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { createEvent, updateEvent, getChurchMembers } from './actions'
import { LocationPicker } from './location-picker'
import { ResponsiblePersonPicker } from './responsible-person-picker'
import type { Event, Location, Person } from './types'

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
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

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function getDefaultStartTime(): string {
  const now = new Date()
  // Round to next hour
  now.setHours(now.getHours() + 1, 0, 0, 0)
  return formatDateTimeLocal(now.toISOString())
}

function getDefaultEndTime(): string {
  const now = new Date()
  // 2 hours from now
  now.setHours(now.getHours() + 3, 0, 0, 0)
  return formatDateTimeLocal(now.toISOString())
}

export const EventDialog = memo(function EventDialog({ open, onOpenChange, event, onSuccess }: EventDialogProps) {
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('service')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [selectedResponsiblePerson, setSelectedResponsiblePerson] = useState<Person | null>(null)
  const [responsiblePersonPickerOpen, setResponsiblePersonPickerOpen] = useState(false)
  const [churchMembers, setChurchMembers] = useState<Person[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [visibility, setVisibility] = useState('members')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [invitePickerOpen, setInvitePickerOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const debouncedInviteSearch = useDebouncedValue(inviteSearch, 300)
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

      if (event) {
        setTitle(event.title)
        setEventType(event.event_type)
        setSelectedLocation(event.location || null)
        setSelectedResponsiblePerson(event.responsible_person || null)
        setStartTime(formatDateTimeLocal(event.start_time))
        setEndTime(formatDateTimeLocal(event.end_time))
        setVisibility(event.visibility || 'members')
        setInvitedUsers(event.event_invitations?.map(inv => inv.profile_id) || [])
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

  // Auto-update end time when start time changes
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)

    if (newStartTime && endTime) {
      const start = new Date(newStartTime)
      const end = new Date(endTime)

      // If end time is before or equal to new start time, set end to start + 1 hour
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

    // Validate times
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
    }

    const result = event
      ? await updateEvent(event.id, data)
      : await createEvent(data)

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
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 max-h-[100dvh] sm:max-h-[90vh] flex flex-col w-full h-full sm:h-auto sm:w-auto fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-none sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the event details below.'
              : 'Add a new event to your church calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunday Morning Service"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {visibility === 'hidden' && (
            <div className="space-y-2">
              <Label>Invite Users</Label>
              <Popover open={invitePickerOpen} onOpenChange={setInvitePickerOpen}>
                <PopoverTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex w-full items-start justify-start text-left h-auto min-h-10 py-2 px-3 border border-input rounded-md bg-white dark:bg-zinc-950 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setInvitePickerOpen(true)
                      }
                    }}
                  >
                    {invitedUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {invitedUsers.map((userId) => {
                          const user = churchMembers.find(m => m.id === userId)
                          return user ? (
                            <span
                              key={userId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-full text-sm"
                            >
                              {user.first_name} {user.last_name}
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInvitedUsers(invitedUsers.filter(id => id !== userId))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation()
                                    setInvitedUsers(invitedUsers.filter(id => id !== userId))
                                  }
                                }}
                                className="hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </span>
                            </span>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select users to invite...</span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2 bg-white dark:bg-zinc-950 border" align="start">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search members..."
                        value={inviteSearch}
                        onChange={(e) => setInviteSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto border border-input rounded-lg p-1">
                      {churchMembers
                        .filter(member =>
                          `${member.first_name} ${member.last_name}`.toLowerCase().includes(debouncedInviteSearch.toLowerCase())
                        )
                        .map((member) => {
                          const isSelected = invitedUsers.includes(member.id)
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setInvitedUsers(invitedUsers.filter(id => id !== member.id))
                                } else {
                                  setInvitedUsers([...invitedUsers, member.id])
                                }
                              }}
                              className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left ${
                                isSelected
                                  ? 'bg-gray-100 dark:bg-zinc-800'
                                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {member.first_name} {member.last_name}
                                </div>
                                {member.email && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {member.email}
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      {churchMembers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No members found
                        </p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {invitedUsers.length === 0 && (
                <p className="text-xs text-amber-600">
                  Private events require at least one invited user
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Location</Label>
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
            onSelect={setSelectedResponsiblePerson}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>
          </div>

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
              disabled={isLoading || !title.trim()}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
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
