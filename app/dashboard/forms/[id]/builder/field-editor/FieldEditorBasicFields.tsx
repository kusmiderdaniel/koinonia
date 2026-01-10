'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/lib/hooks'

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
  const t = useTranslations('forms')
  const isMobile = useIsMobile()

  const fieldWrapper = `border rounded-lg bg-muted/30 ${isMobile ? 'p-2 space-y-1' : 'p-3 space-y-2'}`

  return (
    <>
      {/* Label */}
      <div className={fieldWrapper}>
        <Label htmlFor="label" className={isMobile ? 'text-sm' : ''}>{t('fieldEditor.question')}</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder={t('fieldEditor.questionPlaceholder')}
          className={isMobile ? 'h-9' : ''}
        />
      </div>

      {/* Description */}
      <div className={fieldWrapper}>
        <Label htmlFor="description" className={isMobile ? 'text-sm' : ''}>
          {isMobile ? t('fieldEditor.description') : t('fieldEditor.descriptionOptional')}
        </Label>
        <Textarea
          id="description"
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('fieldEditor.descriptionPlaceholder')}
          rows={isMobile ? 1 : 2}
          className={isMobile ? 'min-h-[36px] py-2' : ''}
        />
      </div>

      {/* Placeholder */}
      {showPlaceholder && (
        <div className={fieldWrapper}>
          <Label htmlFor="placeholder" className={isMobile ? 'text-sm' : ''}>
            {isMobile ? t('fieldEditor.placeholder') : t('fieldEditor.placeholderOptional')}
          </Label>
          <Input
            id="placeholder"
            value={placeholder || ''}
            onChange={(e) => onPlaceholderChange(e.target.value)}
            placeholder={t('fieldEditor.placeholderPlaceholder')}
            className={isMobile ? 'h-9' : ''}
          />
        </div>
      )}
    </>
  )
}
