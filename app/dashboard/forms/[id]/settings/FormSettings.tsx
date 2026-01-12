'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Globe, Lock, EyeOff } from 'lucide-react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import type { FormAccessType } from '@/lib/validations/forms'

export function FormSettings() {
  const t = useTranslations('forms')
  const { form, updateFormTitle, updateFormDescription, updateFormAccessType, updateFormAllowMultipleSubmissions } = useFormBuilder()

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

      {/* Form Title */}
      <div className="space-y-2">
        <Label htmlFor="form-title">{t('settings.formTitle')}</Label>
        <Input
          id="form-title"
          value={form.title}
          onChange={(e) => updateFormTitle(e.target.value)}
          placeholder={t('createDialog.titlePlaceholder')}
        />
      </div>

      {/* Form Description */}
      <div className="space-y-2">
        <Label htmlFor="form-description">{t('settings.formDescription')}</Label>
        <Textarea
          id="form-description"
          value={form.description || ''}
          onChange={(e) => updateFormDescription(e.target.value || null)}
          placeholder={t('createDialog.descriptionPlaceholder')}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {t('settings.descriptionHelp')}
        </p>
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
                    : 'border-input hover:bg-accent/50'
                }`}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`access-${option.value}`}
                  className="mt-0.5"
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

      {/* Status Info */}
      <div className="pt-4 border-t">
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
