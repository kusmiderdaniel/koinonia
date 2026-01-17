'use client'

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
import { ListChecks } from 'lucide-react'
import { formatDuration } from '@/lib/utils/format'
import type { Ministry, Member, Preset, AgendaItemFormState } from './types'

interface AgendaItemDialogFormFieldsProps {
  formState: AgendaItemFormState
  isEditing: boolean
  ministries: Ministry[]
  members: Member[]
  presets: Preset[]
  isLoadingMembers: boolean
  error: string | null
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setMinistryId: (value: string) => void
  setLeaderId: (value: string) => void
  handleMinutesChange: (value: string) => void
  handleSecondsChange: (value: string) => void
  handlePresetSelect: (presetId: string) => void
}

export function AgendaItemDialogFormFields({
  formState,
  isEditing,
  ministries,
  members,
  presets,
  isLoadingMembers,
  error,
  setTitle,
  setDescription,
  setMinistryId,
  setLeaderId,
  handleMinutesChange,
  handleSecondsChange,
  handlePresetSelect,
}: AgendaItemDialogFormFieldsProps) {
  return (
    <div className="space-y-4 py-4">
      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
          {error}
        </div>
      )}

      {/* Preset selector - only show when adding new item and presets exist */}
      {!isEditing && presets.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Use Preset
          </Label>
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
              <SelectValue placeholder="Select a preset to auto-fill..." />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input max-h-[200px]"
            >
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{preset.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(preset.duration_seconds)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Or fill in the fields manually below
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formState.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Welcome & Announcements"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Duration (MM:SS) *</Label>
        <div className="flex items-center gap-1">
          <Input
            value={formState.durationMinutes}
            onChange={(e) => handleMinutesChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            placeholder="MM"
            maxLength={2}
          />
          <span className="text-lg font-medium text-muted-foreground">:</span>
          <Input
            value={formState.durationSeconds}
            onChange={(e) => handleSecondsChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="w-16 text-center"
            placeholder="SS"
            maxLength={2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsible Ministry *</Label>
        <Select value={formState.ministryId} onValueChange={setMinistryId}>
          <SelectTrigger className="bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Select a ministry..." />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="bg-white dark:bg-zinc-950"
          >
            {ministries.map((ministry) => (
              <SelectItem key={ministry.id} value={ministry.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ministry.color }}
                  />
                  {ministry.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leader">Leader</Label>
        <Select
          value={formState.leaderId}
          onValueChange={setLeaderId}
          disabled={!formState.ministryId}
        >
          <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input">
            <SelectValue
              placeholder={
                !formState.ministryId
                  ? 'Select ministry first'
                  : isLoadingMembers
                    ? 'Loading...'
                    : 'Select a leader (optional)'
              }
            />
          </SelectTrigger>
          <SelectContent
            align="start"
            className="bg-white dark:bg-zinc-950 border border-input max-h-[200px]"
          >
            <SelectItem value="none">No leader assigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formState.ministryId && members.length === 0 && !isLoadingMembers && (
          <p className="text-xs text-muted-foreground">
            No members in this ministry yet
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes or details..."
          rows={3}
        />
      </div>
    </div>
  )
}
