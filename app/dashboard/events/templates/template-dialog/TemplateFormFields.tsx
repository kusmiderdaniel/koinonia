'use client'

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
import { MapPin, X, Eye, Lock, User } from 'lucide-react'
import { SingleCampusPicker } from '@/components/CampusPicker'
import type { TemplateFormData, Location, Person, Campus } from './types'
import { EVENT_TYPES, VISIBILITY_LEVELS, DURATION_OPTIONS } from './types'

interface TemplateFormFieldsProps {
  formData: TemplateFormData
  updateField: <K extends keyof TemplateFormData>(field: K, value: TemplateFormData[K]) => void
  campuses: Campus[]
  onCampusChange: (campusId: string | null) => void
  onOpenLocationPicker: () => void
  onOpenResponsiblePersonPicker: () => void
}

export function TemplateFormFields({
  formData,
  updateField,
  campuses,
  onCampusChange,
  onOpenLocationPicker,
  onOpenResponsiblePersonPicker,
}: TemplateFormFieldsProps) {
  return (
    <>
      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Sunday Morning Service"
          required
        />
      </div>

      {/* Event Type & Visibility */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type *</Label>
          <Select value={formData.eventType} onValueChange={(v) => updateField('eventType', v)}>
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
          <Select value={formData.visibility} onValueChange={(v) => updateField('visibility', v)}>
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input [&_[data-description]]:hidden">
              <div className="flex items-center gap-2">
                {formData.visibility === 'hidden' ? (
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

      {/* Start Time & Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultStartTime">Default Start Time *</Label>
          <Input
            id="defaultStartTime"
            type="time"
            value={formData.defaultStartTime}
            onChange={(e) => updateField('defaultStartTime', e.target.value)}
            className="rounded-lg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Select
            value={formData.defaultDurationMinutes.toString()}
            onValueChange={(v) => updateField('defaultDurationMinutes', parseInt(v))}
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Template description..."
          rows={2}
        />
      </div>

      {/* Campus */}
      {campuses.length > 0 && (
        <div className="space-y-2">
          <Label>Campus</Label>
          <SingleCampusPicker
            campuses={campuses}
            selectedCampusId={formData.campusId}
            onChange={onCampusChange}
            placeholder="All campuses"
          />
          <p className="text-sm text-muted-foreground">
            Leave empty for a church-wide template
          </p>
        </div>
      )}

      {/* Location */}
      <EntitySelectionField
        label="Default Location"
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
        placeholder="Choose location..."
      />

      {/* Responsible Person */}
      <EntitySelectionField
        label="Responsible Person"
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
        placeholder="Choose responsible person..."
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
        <div className="flex items-center gap-2 p-3 border border-gray-300 dark:border-zinc-700 rounded-lg bg-muted/50">
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
          className="w-full justify-start text-muted-foreground rounded-lg !border !border-gray-300 dark:!border-zinc-700"
          onClick={onSelect}
        >
          <Icon className="w-4 h-4 mr-2" />
          {placeholder}
        </Button>
      )}
    </div>
  )
}
