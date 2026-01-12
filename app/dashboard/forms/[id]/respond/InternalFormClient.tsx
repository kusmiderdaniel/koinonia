'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  FormFields,
  useFormConditions,
  useFormState,
  useFormValidation,
  type FormData,
  type FormField,
  type FormCondition,
} from '@/components/forms'
import { submitInternalForm } from '../../actions/submissions'

interface Respondent {
  id: string
  name: string
  email: string
}

interface InternalFormClientProps {
  formId: string
  form: FormData
  fields: FormField[]
  conditions: FormCondition[]
  respondent: Respondent
  hasExistingSubmission: boolean
  isAnonymous?: boolean
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function InternalFormClient({
  formId,
  form,
  fields,
  conditions,
  respondent,
  hasExistingSubmission,
  isAnonymous = false,
  weekStartsOn = 0,
}: InternalFormClientProps) {
  const t = useTranslations('forms')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Form state management
  const {
    values,
    errors,
    setErrors,
    handleValueChange,
    handleMultiSelectChange,
  } = useFormState()

  // Conditional logic
  const { visibleFields } = useFormConditions({
    fields,
    conditions,
    values,
  })

  // Validation
  const { validateForm } = useFormValidation({
    visibleFields,
    values,
    setErrors,
  })

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

        const result = await submitInternalForm({ formId, responses })

        if (result.error) {
          throw new Error(result.error)
        }

        setIsSubmitted(true)
        toast.success(t('toast.submitted'))
      } catch (error) {
        console.error('Submission error:', error)
        toast.error(
          error instanceof Error ? error.message : t('toast.submitFailed')
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [formId, visibleFields, values, validateForm, t]
  )

  // Already submitted state (for single-response forms)
  if (hasExistingSubmission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{t('internal.alreadySubmittedTitle')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('internal.alreadySubmittedDescription')}
          </p>

          <Button variant="outline" asChild>
            <Link href="/dashboard">{t('internal.backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{t('internal.thankYou')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('internal.successMessage')}
          </p>

          <Button variant="outline" asChild>
            <Link href="/dashboard">{t('internal.backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('internal.backToDashboard')}
            </Link>
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b bg-gradient-to-br from-brand/5 to-transparent">
            <h1 className="text-2xl md:text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="mt-2 text-muted-foreground">{form.description}</p>
            )}
          </div>

          {/* Respondent info - hidden for anonymous forms */}
          {!isAnonymous && (
            <div className="px-6 md:px-8 py-4 bg-muted/30 border-b">
              <p className="text-sm text-muted-foreground">
                {t('internal.respondingAs', { name: respondent.name || respondent.email })}
              </p>
            </div>
          )}

          {/* Fields */}
          <div className="p-6 md:p-8">
            <FormFields
              fields={visibleFields}
              values={values}
              errors={errors}
              onValueChange={handleValueChange}
              onMultiSelectChange={handleMultiSelectChange}
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
                  {t('internal.submitting')}
                </>
              ) : (
                t('internal.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
