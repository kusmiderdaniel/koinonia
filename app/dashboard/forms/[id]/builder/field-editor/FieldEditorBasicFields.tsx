'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/lib/hooks'
import type { Locale } from '@/lib/i18n/config'
import type { TranslatedString } from '@/lib/validations/forms'

interface FieldEditorBasicFieldsProps {
  label: string
  description: string | null
  placeholder: string | null
  showPlaceholder: boolean
  onLabelChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPlaceholderChange: (value: string) => void
  // Multilingual props
  isMultilingual?: boolean
  activeLocale?: Locale
  labelI18n?: TranslatedString | null
  descriptionI18n?: TranslatedString | null
  placeholderI18n?: TranslatedString | null
  onLabelI18nChange?: (locale: Locale, value: string) => void
  onDescriptionI18nChange?: (locale: Locale, value: string) => void
  onPlaceholderI18nChange?: (locale: Locale, value: string) => void
}

export function FieldEditorBasicFields({
  label,
  description,
  placeholder,
  showPlaceholder,
  onLabelChange,
  onDescriptionChange,
  onPlaceholderChange,
  isMultilingual = false,
  activeLocale = 'en',
  labelI18n,
  descriptionI18n,
  placeholderI18n,
  onLabelI18nChange,
  onDescriptionI18nChange,
  onPlaceholderI18nChange,
}: FieldEditorBasicFieldsProps) {
  const t = useTranslations('forms')
  const isMobile = useIsMobile()

  const fieldWrapper = `border rounded-lg bg-muted/30 ${isMobile ? 'p-2 space-y-1' : 'p-3 space-y-2'}`

  // Get the value for the current locale
  const getLabelValue = () => {
    if (!isMultilingual) return label
    if (activeLocale === 'en') return labelI18n?.en || label
    return labelI18n?.[activeLocale] || ''
  }

  const getDescriptionValue = () => {
    if (!isMultilingual) return description || ''
    if (activeLocale === 'en') return descriptionI18n?.en || description || ''
    return descriptionI18n?.[activeLocale] || ''
  }

  const getPlaceholderValue = () => {
    if (!isMultilingual) return placeholder || ''
    if (activeLocale === 'en') return placeholderI18n?.en || placeholder || ''
    return placeholderI18n?.[activeLocale] || ''
  }

  // Handle value changes
  const handleLabelValueChange = (value: string) => {
    if (isMultilingual && onLabelI18nChange) {
      onLabelI18nChange(activeLocale, value)
    } else {
      onLabelChange(value)
    }
  }

  const handleDescriptionValueChange = (value: string) => {
    if (isMultilingual && onDescriptionI18nChange) {
      onDescriptionI18nChange(activeLocale, value)
    } else {
      onDescriptionChange(value)
    }
  }

  const handlePlaceholderValueChange = (value: string) => {
    if (isMultilingual && onPlaceholderI18nChange) {
      onPlaceholderI18nChange(activeLocale, value)
    } else {
      onPlaceholderChange(value)
    }
  }

  return (
    <>
      {/* Label */}
      <div className={fieldWrapper}>
        <Label htmlFor="label" className={isMobile ? 'text-sm' : ''}>{t('fieldEditor.question')}</Label>
        <Input
          id="label"
          value={getLabelValue()}
          onChange={(e) => handleLabelValueChange(e.target.value)}
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
          value={getDescriptionValue()}
          onChange={(e) => handleDescriptionValueChange(e.target.value)}
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
            value={getPlaceholderValue()}
            onChange={(e) => handlePlaceholderValueChange(e.target.value)}
            placeholder={t('fieldEditor.placeholderPlaceholder')}
            className={isMobile ? 'h-9' : ''}
          />
        </div>
      )}
    </>
  )
}
