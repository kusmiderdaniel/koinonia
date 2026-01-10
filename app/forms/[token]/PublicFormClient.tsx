'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks'
import {
  FormFields,
  useFormConditions,
  useFormState,
  useFormValidation,
  type FormData,
  type FormField,
  type FormCondition,
} from '@/components/forms'

interface PublicFormClientProps {
  token: string
  form: FormData
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
    [token, visibleFields, values, email, validateForm, router, t]
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
            <h1 className="text-2xl md:text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="mt-2 text-muted-foreground">{form.description}</p>
            )}
          </div>

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

            {/* Optional email for anonymous submissions */}
            <div className="pt-6 mt-6 border-t space-y-2">
              <Label htmlFor="respondent-email" className="text-base font-medium">
                {t('public.emailOptional')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('public.emailDescription')}
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
                  {t('public.submitting')}
                </>
              ) : (
                t('public.submit')
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
