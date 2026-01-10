'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, X, User, Eye, Lock, Building2 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { LocationPicker } from '../LocationPicker'
import { ResponsiblePersonPicker } from '../ResponsiblePersonPicker'
import { CampusPicker } from '@/components/CampusPicker'
import { InviteUsersPicker } from './InviteUsersPicker'
import { EVENT_TYPE_VALUES, VISIBILITY_VALUES } from './constants'
import type { EventFormFieldsProps } from './types'

export const EventFormFields = memo(function EventFormFields({
  title,
  setTitle,
  eventType,
  setEventType,
  visibility,
  setVisibility,
  campuses,
  campusesLoading,
  selectedCampusIds,
  onCampusChange,
  invitedUsers,
  setInvitedUsers,
  churchMembers,
  selectedLocation,
  setSelectedLocation,
  locationPickerOpen,
  setLocationPickerOpen,
  selectedResponsiblePerson,
  setSelectedResponsiblePerson,
  responsiblePersonPickerOpen,
  setResponsiblePersonPickerOpen,
  startTime,
  endTime,
  onStartTimeChange,
  setEndTime,
  timeFormat = '24h',
  error,
}: EventFormFieldsProps) {
  const t = useTranslations('events')
  const isMobile = useIsMobile()

  return (
    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
      {error && (
        <div className={`text-red-600 bg-red-50 rounded-md ${isMobile ? 'text-xs p-2' : 'text-sm p-3'}`}>{error}</div>
      )}

      <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
        <Label htmlFor="title" className={isMobile ? 'text-sm' : ''}>{t('form.titleRequired')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('form.titlePlaceholder')}
          required
        />
      </div>

      <div className={`grid grid-cols-2 ${isMobile ? 'gap-3' : 'gap-4'}`}>
        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          <Label htmlFor="eventType" className={isMobile ? 'text-sm' : ''}>{t('form.eventTypeRequired')}</Label>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              {EVENT_TYPE_VALUES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                >
                  {t(`types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          <Label htmlFor="visibility" className={isMobile ? 'text-sm' : ''}>{t('form.visibilityLabel')}</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white [&_[data-description]]:hidden">
              <div className="flex items-center gap-2">
                {visibility === 'hidden' ? (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">{t(`visibility.${visibility}Short`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              {VISIBILITY_VALUES.map((v) => (
                <SelectItem
                  key={v}
                  value={v}
                  textValue={t(`visibility.${v}`)}
                  className="py-2 cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                >
                  <div className="flex flex-col">
                    <span>{t(`visibility.${v}`)}</span>
                    <span
                      data-description
                      className="text-xs text-muted-foreground font-normal"
                    >
                      {t(`visibility.${v}Description`)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campus Selection */}
      <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
        <Label className={isMobile ? 'text-sm' : ''}>{t('form.campusLabel')}</Label>
        {campusesLoading ? (
          <div className="flex items-center gap-2 h-10 px-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : campuses.length > 0 ? (
          <CampusPicker
            campuses={campuses}
            selectedCampusIds={selectedCampusIds}
            onChange={onCampusChange}
            multiple={true}
            placeholder={t('form.campusPlaceholder')}
          />
        ) : null}
      </div>

      {visibility === 'hidden' && (
        <InviteUsersPicker
          invitedUsers={invitedUsers}
          setInvitedUsers={setInvitedUsers}
          churchMembers={churchMembers}
        />
      )}

      <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
        <Label className={isMobile ? 'text-sm' : ''}>{t('form.locationLabel')}</Label>
        {selectedLocation ? (
          <div className="flex items-center gap-2 p-3 border border-black dark:border-white rounded-lg bg-muted/50">
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
            className="w-full justify-start text-muted-foreground rounded-lg !border !border-black dark:!border-white"
            onClick={() => setLocationPickerOpen(true)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t('form.chooseLocation')}
          </Button>
        )}
      </div>

      <LocationPicker
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        selectedLocationId={selectedLocation?.id || null}
        onSelect={setSelectedLocation}
        filterByCampusIds={selectedCampusIds}
      />

      <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
        <Label className={isMobile ? 'text-sm' : ''}>{t('form.responsiblePersonLabel')}</Label>
        {selectedResponsiblePerson ? (
          <div className="flex items-center gap-2 p-3 border border-black dark:border-white rounded-lg bg-muted/50">
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
            className="w-full justify-start text-muted-foreground rounded-lg !border !border-black dark:!border-white"
            onClick={() => setResponsiblePersonPickerOpen(true)}
          >
            <User className="w-4 h-4 mr-2" />
            {t('form.chooseResponsiblePerson')}
          </Button>
        )}
      </div>

      <ResponsiblePersonPicker
        open={responsiblePersonPickerOpen}
        onOpenChange={setResponsiblePersonPickerOpen}
        selectedPersonId={selectedResponsiblePerson?.id || null}
        onSelect={setSelectedResponsiblePerson}
      />

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-4'}`}>
        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          <Label htmlFor="startTime" className={isMobile ? 'text-sm' : ''}>{t('form.startTimeRequired')}</Label>
          <DateTimePicker
            id="startTime"
            value={startTime}
            onChange={onStartTimeChange}
            placeholder={t('form.startTimePlaceholder')}
            label="Start Time"
            timeFormat={timeFormat}
          />
        </div>

        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          <Label htmlFor="endTime" className={isMobile ? 'text-sm' : ''}>{t('form.endTimeRequired')}</Label>
          <DateTimePicker
            id="endTime"
            value={endTime}
            onChange={setEndTime}
            placeholder={t('form.endTimePlaceholder')}
            label="End Time"
            timeFormat={timeFormat}
          />
        </div>
      </div>
    </div>
  )
})
