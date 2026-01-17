'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Globe, Lock, EyeOff, Languages } from 'lucide-react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { LanguageTabs } from '@/components/forms'
import type { FormAccessType } from '@/lib/validations/forms'
import type { Locale } from '@/lib/i18n/config'

export function FormSettings() {
  const t = useTranslations('forms')
  const { form, updateFormTitle, updateFormDescription, updateFormTitleI18n, updateFormDescriptionI18n, updateFormAccessType, updateFormAllowMultipleSubmissions, updateFormIsMultilingual } = useFormBuilder()
  const [activeLocale, setActiveLocale] = useState<Locale>('en')

  if (!form) return null

  const accessTypeOptions = [
    {
      value: 'internal' as FormAccessType,
      title: t('access.membersOnly'),
      description: t('access.membersOnlyDescription'),
      icon: Lock,
    },
    {
      value: 'internal_anonymous' as FormAccessType,
      title: t('access.membersAnonymous'),
      description: t('access.membersAnonymousDescription'),
      icon: EyeOff,
    },
    {
      value: 'public' as FormAccessType,
      title: t('access.anyone'),
      description: t('access.anyoneDescription'),
      icon: Globe,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('settings.title')}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t('settings.description')}
        </p>
      </div>

      {/* Form Title & Description */}
      <div className="space-y-4">
        {/* Language selector for multilingual forms */}
        {form.is_multilingual && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('builder.previewLanguage')}</span>
            <LanguageTabs
              activeLocale={activeLocale}
              onLocaleChange={setActiveLocale}
              shortLabels
            />
          </div>
        )}

        {/* Form Title */}
        <div className="space-y-2">
          <Label htmlFor="form-title">{t('settings.formTitle')}</Label>
          {form.is_multilingual ? (
            <Input
              id="form-title"
              value={
                activeLocale === 'en'
                  ? form.title_i18n?.en || form.title
                  : form.title_i18n?.[activeLocale] || ''
              }
              onChange={(e) => updateFormTitleI18n(activeLocale, e.target.value)}
              placeholder={activeLocale !== 'en' ? form.title : t('createDialog.titlePlaceholder')}
              className="!border !border-black/20 dark:!border-white/20"
            />
          ) : (
            <Input
              id="form-title"
              value={form.title}
              onChange={(e) => updateFormTitle(e.target.value)}
              placeholder={t('createDialog.titlePlaceholder')}
              className="!border !border-black/20 dark:!border-white/20"
            />
          )}
        </div>

        {/* Form Description */}
        <div className="space-y-2">
          <Label htmlFor="form-description">{t('settings.formDescription')}</Label>
          {form.is_multilingual ? (
            <Textarea
              id="form-description"
              value={
                activeLocale === 'en'
                  ? form.description_i18n?.en || form.description || ''
                  : form.description_i18n?.[activeLocale] || ''
              }
              onChange={(e) => updateFormDescriptionI18n(activeLocale, e.target.value)}
              placeholder={activeLocale !== 'en' ? (form.description || '') : t('createDialog.descriptionPlaceholder')}
              rows={4}
              className="!border !border-black/20 dark:!border-white/20"
            />
          ) : (
            <Textarea
              id="form-description"
              value={form.description || ''}
              onChange={(e) => updateFormDescription(e.target.value || null)}
              placeholder={t('createDialog.descriptionPlaceholder')}
              rows={4}
              className="!border !border-black/20 dark:!border-white/20"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {t('settings.descriptionHelp')}
          </p>
        </div>
      </div>

      {/* Access Type */}
      <div className="space-y-3">
        <Label>{t('settings.accessType')}</Label>
        <RadioGroup
          value={form.access_type}
          onValueChange={(value) => updateFormAccessType(value as FormAccessType)}
          className="space-y-3"
        >
          {accessTypeOptions.map((option) => {
            const Icon = option.icon
            return (
              <label
                key={option.value}
                htmlFor={`access-${option.value}`}
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  form.access_type === option.value
                    ? 'border-brand bg-brand/5'
                    : 'border-black/20 dark:border-white/20 hover:bg-accent/50'
                }`}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`access-${option.value}`}
                  className="mt-0.5 border-black/20 dark:border-white/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{option.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Multiple Submissions - only for internal (non-anonymous) forms */}
      {form.access_type === 'internal' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-multiple">{t('settings.allowMultipleSubmissions')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.allowMultipleSubmissionsDescription')}
              </p>
            </div>
            <Switch
              id="allow-multiple"
              checked={form.allow_multiple_submissions}
              onCheckedChange={updateFormAllowMultipleSubmissions}
            />
          </div>
        </div>
      )}

      {/* Multilingual Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="is-multilingual">{t('settings.multilingualForm')}</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.multilingualFormDescription')}
            </p>
          </div>
          <Switch
            id="is-multilingual"
            checked={form.is_multilingual}
            onCheckedChange={updateFormIsMultilingual}
          />
        </div>
      </div>

      {/* Status Info */}
      <div className="pt-4 border-t border-black/20 dark:border-white/20">
        <h3 className="text-sm font-medium mb-2">{t('settings.formStatus')}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              form.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : form.status === 'closed'
                ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {t(`status.${form.status}`)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t(`settings.statusHelp.${form.status}`)}
          </span>
        </div>
      </div>
    </div>
  )
}
