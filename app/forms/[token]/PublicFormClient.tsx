'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks'
import {
  FormFields,
  LanguageSelector,
  useFormAnalytics,
  useFormConditions,
  useFormState,
  useFormValidation,
  type FormData,
  type FormField,
  type FormCondition,
} from '@/components/forms'
import { resolveFormFields, resolveFormTitleDescription } from '@/lib/i18n/form-helpers'
import type { TranslatedString } from '@/lib/validations/forms'
import { defaultLocale, type Locale } from '@/lib/i18n/config'

// Translations for public form UI elements (used when form language differs from app locale)
const publicFormTranslations: Record<Locale, {
  emailOptional: string
  emailDescription: string
  submit: string
  submitting: string
}> = {
  en: {
    emailOptional: 'Your email (optional)',
    emailDescription: "Provide your email if you'd like to receive updates about this submission",
    submit: 'Submit',
    submitting: 'Submitting...',
  },
  pl: {
    emailOptional: 'Twój email (opcjonalnie)',
    emailDescription: 'Podaj swój email, jeśli chcesz otrzymywać aktualizacje dotyczące tego zgłoszenia',
    submit: 'Prześlij',
    submitting: 'Przesyłanie...',
  },
}

interface PublicFormClientProps {
  token: string
  form: FormData & {
    is_multilingual?: boolean
    title_i18n?: TranslatedString | null
    description_i18n?: TranslatedString | null
  }
  fields: FormField[]
  conditions: FormCondition[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function PublicFormClient({
  token,
  form,
  fields,
  conditions,
  weekStartsOn = 0,
}: PublicFormClientProps) {
  const router = useRouter()
  const t = useTranslations('forms')
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedLocale, setSelectedLocale] = useState<Locale>(defaultLocale)

  // Read from localStorage after mount (to avoid hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem('formLanguage') as Locale
    if (stored && (stored === 'en' || stored === 'pl')) {
      setSelectedLocale(stored)
    }
  }, [])

  // Resolve fields to the selected locale
  const resolvedFields = useMemo(() => {
    if (!form.is_multilingual) return fields
    return resolveFormFields(fields, selectedLocale)
  }, [fields, form.is_multilingual, selectedLocale])

  // Resolve form title and description to the selected locale
  const resolvedForm = useMemo(() => {
    if (!form.is_multilingual) return { title: form.title, description: form.description }
    return resolveFormTitleDescription(form, selectedLocale)
  }, [form, selectedLocale])

  // Get UI translations for the selected locale (for multilingual forms)
  const formT = form.is_multilingual ? publicFormTranslations[selectedLocale] : null

  // Handle locale change and persist to localStorage
  const handleLocaleChange = useCallback((locale: Locale) => {
    setSelectedLocale(locale)
    localStorage.setItem('formLanguage', locale)
  }, [])

  // Form state management
  const {
    values,
    errors,
    setErrors,
    handleValueChange,
    handleMultiSelectChange,
  } = useFormState()

  // Conditional logic - use resolved fields for display, original for ID references
  const { visibleFields } = useFormConditions({
    fields: resolvedFields,
    conditions,
    values,
  })

  // Validation
  const { validateForm } = useFormValidation({
    visibleFields,
    values,
    setErrors,
  })

  // Analytics tracking
  const { trackStart, trackSubmit } = useFormAnalytics({
    formId: form.id || '',
    token,
  })

  // Wrap value change to track start
  const handleValueChangeWithTracking = useCallback(
    (fieldId: string, value: unknown) => {
      trackStart()
      handleValueChange(fieldId, value)
    },
    [trackStart, handleValueChange]
  )

  const handleMultiSelectChangeWithTracking = useCallback(
    (fieldId: string, optionValue: string, checked: boolean) => {
      trackStart()
      handleMultiSelectChange(fieldId, optionValue, checked)
    },
    [trackStart, handleMultiSelectChange]
  )

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        toast.error(t('toast.fillRequired'))
        return
      }

      setIsSubmitting(true)

      try {
        // Build responses object with only visible field values
        const responses: Record<string, unknown> = {}
        for (const field of visibleFields) {
          if (values[field.id] !== undefined) {
            responses[field.id] = values[field.id]
          }
        }

        const response = await fetch(`/api/public-forms/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses,
            email: email || undefined,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('toast.submitFailed'))
        }

        trackSubmit()
        toast.success(t('toast.submitted'))
        router.push(`/forms/${token}/success`)
      } catch (error) {
        console.error('Submission error:', error)
        toast.error(
          error instanceof Error ? error.message : t('toast.submitFailed')
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [token, visibleFields, values, email, validateForm, router, t, trackSubmit]
  )

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b bg-gradient-to-br from-brand/5 to-transparent">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{resolvedForm.title}</h1>
                {resolvedForm.description && (
                  <p className="mt-2 text-muted-foreground">{resolvedForm.description}</p>
                )}
              </div>
              {form.is_multilingual && (
                <LanguageSelector
                  currentLocale={selectedLocale}
                  onLocaleChange={handleLocaleChange}
                />
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="p-6 md:p-8">
            {/* Optional email for anonymous submissions */}
            <div className="pb-6 mb-6 border-b space-y-2">
              <Label htmlFor="respondent-email" className="text-base font-medium">
                {formT?.emailOptional || t('public.emailOptional')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {formT?.emailDescription || t('public.emailDescription')}
              </p>
              <div className={isMobile ? '' : 'w-1/2'}>
                <Input
                  id="respondent-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <FormFields
              fields={visibleFields}
              values={values}
              errors={errors}
              onValueChange={handleValueChangeWithTracking}
              onMultiSelectChange={handleMultiSelectChangeWithTracking}
              weekStartsOn={weekStartsOn}
            />
          </div>

          {/* Submit */}
          <div className="p-6 md:p-8 border-t bg-muted/30">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 h-9 rounded-full text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 flex items-center justify-center"
              style={{ backgroundColor: '#f49f1e' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {formT?.submitting || t('public.submitting')}
                </>
              ) : (
                formT?.submit || t('public.submit')
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('public.poweredBy')}
        </p>
      </div>
    </div>
  )
}
