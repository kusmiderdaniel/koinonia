'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/lib/hooks'
import { useFieldEditorContext } from './FieldEditorContext'

export function FieldEditorBasicFields() {
  const t = useTranslations('forms')
  const isMobile = useIsMobile()
  const {
    selectedField,
    isMultilingual,
    activeLocale,
    showPlaceholder,
    handleLabelChange,
    handleDescriptionChange,
    handlePlaceholderChange,
    handleLabelI18nChange,
    handleDescriptionI18nChange,
    handlePlaceholderI18nChange,
  } = useFieldEditorContext()

  if (!selectedField) return null

  const fieldWrapper = `border rounded-lg bg-muted/30 ${isMobile ? 'p-2 space-y-1' : 'p-3 space-y-2'}`

  // Get the value for the current locale
  const getLabelValue = () => {
    if (!isMultilingual) return selectedField.label
    if (activeLocale === 'en') return selectedField.label_i18n?.en || selectedField.label
    return selectedField.label_i18n?.[activeLocale] || ''
  }

  const getDescriptionValue = () => {
    if (!isMultilingual) return selectedField.description || ''
    if (activeLocale === 'en') return selectedField.description_i18n?.en || selectedField.description || ''
    return selectedField.description_i18n?.[activeLocale] || ''
  }

  const getPlaceholderValue = () => {
    if (!isMultilingual) return selectedField.placeholder || ''
    if (activeLocale === 'en') return selectedField.placeholder_i18n?.en || selectedField.placeholder || ''
    return selectedField.placeholder_i18n?.[activeLocale] || ''
  }

  // Handle value changes
  const handleLabelValueChange = (value: string) => {
    if (isMultilingual) {
      handleLabelI18nChange(activeLocale, value)
    } else {
      handleLabelChange(value)
    }
  }

  const handleDescriptionValueChange = (value: string) => {
    if (isMultilingual) {
      handleDescriptionI18nChange(activeLocale, value)
    } else {
      handleDescriptionChange(value)
    }
  }

  const handlePlaceholderValueChange = (value: string) => {
    if (isMultilingual) {
      handlePlaceholderI18nChange(activeLocale, value)
    } else {
      handlePlaceholderChange(value)
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
