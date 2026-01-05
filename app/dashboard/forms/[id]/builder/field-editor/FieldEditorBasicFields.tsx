'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface FieldEditorBasicFieldsProps {
  label: string
  description: string | null
  placeholder: string | null
  showPlaceholder: boolean
  onLabelChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPlaceholderChange: (value: string) => void
}

export function FieldEditorBasicFields({
  label,
  description,
  placeholder,
  showPlaceholder,
  onLabelChange,
  onDescriptionChange,
  onPlaceholderChange,
}: FieldEditorBasicFieldsProps) {
  return (
    <>
      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Question</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Enter your question"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add help text for this question"
          rows={2}
        />
      </div>

      {/* Placeholder */}
      {showPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder (optional)</Label>
          <Input
            id="placeholder"
            value={placeholder || ''}
            onChange={(e) => onPlaceholderChange(e.target.value)}
            placeholder="Placeholder text"
          />
        </div>
      )}
    </>
  )
}
