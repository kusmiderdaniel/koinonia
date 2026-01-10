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
import { TimePicker } from '@/components/ui/time-picker'
import { MapPin, X, Eye, Lock, User } from 'lucide-react'
import { SingleCampusPicker } from '@/components/CampusPicker'
import type { TemplateFormData, Location, Person, Campus } from './types'
import { EVENT_TYPE_VALUES, VISIBILITY_VALUES, DURATION_VALUES } from './types'

interface TemplateFormFieldsProps {
  formData: TemplateFormData
  updateField: <K extends keyof TemplateFormData>(field: K, value: TemplateFormData[K]) => void
  campuses: Campus[]
  onCampusChange: (campusId: string | null) => void
  onOpenLocationPicker: () => void
  onOpenResponsiblePersonPicker: () => void
  timeFormat?: '12h' | '24h'
}

export function TemplateFormFields({
  formData,
  updateField,
  campuses,
  onCampusChange,
  onOpenLocationPicker,
  onOpenResponsiblePersonPicker,
  timeFormat = '24h',
}: TemplateFormFieldsProps) {
  const t = useTranslations('events')

  return (
    <>
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('templateDialog.nameLabel')} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={t('templateDialog.namePlaceholder')}
          required
        />
      </div>

      {/* Event Type & Visibility */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventType">{t('form.eventTypeRequired')}</Label>
          <Select value={formData.eventType} onValueChange={(v) => updateField('eventType', v)}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
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

        <div className="space-y-2">
          <Label htmlFor="visibility">{t('form.visibilityLabel')}</Label>
          <Select value={formData.visibility} onValueChange={(v) => updateField('visibility', v)}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white [&_[data-description]]:hidden">
              <div className="flex items-center gap-2">
                {formData.visibility === 'hidden' ? (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">{t(`visibility.${formData.visibility}Short`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
              {VISIBILITY_VALUES.map((v) => (
                <SelectItem
                  key={v}
                  value={v}
                  textValue={t(`visibility.${v}`)}
                  className="py-2 cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                >
                  <div className="flex flex-col">
                    <span>{t(`visibility.${v}`)}</span>
                    <span data-description className="text-xs text-muted-foreground font-normal">{t(`visibility.${v}Description`)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start Time & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 min-w-0">
          <Label htmlFor="defaultStartTime">{t('form.startTimeRequired')}</Label>
          <TimePicker
            id="defaultStartTime"
            value={formData.defaultStartTime}
            onChange={(value) => updateField('defaultStartTime', value)}
            timeFormat={timeFormat}
            placeholder={t('form.startTimePlaceholder')}
          />
        </div>

        <div className="space-y-2 min-w-0">
          <Label htmlFor="duration">{t('templateDialog.durationLabel')}</Label>
          <Select
            value={formData.defaultDurationMinutes.toString()}
            onValueChange={(v) => updateField('defaultDurationMinutes', parseInt(v))}
          >
            <SelectTrigger className="w-full bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="bg-white dark:bg-zinc-950 border border-input">
              {DURATION_VALUES.map((minutes) => (
                <SelectItem
                  key={minutes}
                  value={minutes.toString()}
                  className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                >
                  {t(`templateDialog.duration.${minutes}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('templateDialog.descriptionLabel')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t('templateDialog.descriptionPlaceholder')}
          rows={2}
        />
      </div>

      {/* Campus */}
      {campuses.length > 0 && (
        <div className="space-y-2">
          <Label>{t('form.campusLabel')}</Label>
          <SingleCampusPicker
            campuses={campuses}
            selectedCampusId={formData.campusId}
            onChange={onCampusChange}
            placeholder={t('templateDialog.allCampuses')}
          />
          <p className="text-sm text-muted-foreground">
            {t('templateDialog.campusHint')}
          </p>
        </div>
      )}

      {/* Location */}
      <EntitySelectionField
        label={t('templateDialog.defaultLocation')}
        icon={MapPin}
        value={formData.selectedLocation}
        onClear={() => updateField('selectedLocation', null)}
        onSelect={onOpenLocationPicker}
        renderValue={(location) => (
          <>
            <div className="font-medium truncate">{location.name}</div>
            {location.address && (
              <div className="text-sm text-muted-foreground truncate">{location.address}</div>
            )}
          </>
        )}
        placeholder={t('form.chooseLocation')}
      />

      {/* Responsible Person */}
      <EntitySelectionField
        label={t('form.responsiblePersonLabel')}
        icon={User}
        value={formData.selectedResponsiblePerson}
        onClear={() => updateField('selectedResponsiblePerson', null)}
        onSelect={onOpenResponsiblePersonPicker}
        renderValue={(person) => (
          <>
            <div className="font-medium truncate">
              {person.first_name} {person.last_name}
            </div>
            {person.email && (
              <div className="text-sm text-muted-foreground truncate">{person.email}</div>
            )}
          </>
        )}
        placeholder={t('form.chooseResponsiblePerson')}
      />
    </>
  )
}

// Reusable component for entity selection fields (Location, Person, etc.)
interface EntitySelectionFieldProps<T> {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: T | null
  onClear: () => void
  onSelect: () => void
  renderValue: (value: T) => React.ReactNode
  placeholder: string
}

function EntitySelectionField<T>({
  label,
  icon: Icon,
  value,
  onClear,
  onSelect,
  renderValue,
  placeholder,
}: EntitySelectionFieldProps<T>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 p-3 border border-black dark:border-white rounded-lg bg-muted/50">
          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {renderValue(value)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 rounded-full"
            onClick={onClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-muted-foreground rounded-lg !border !border-black dark:!border-white"
          onClick={onSelect}
        >
          <Icon className="w-4 h-4 mr-2" />
          {placeholder}
        </Button>
      )}
    </div>
  )
}
