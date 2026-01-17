'use client'

import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import type { FormData } from './types'

interface JoinCodeStepProps {
  form: UseFormReturn<FormData>
  error: string | null
  isLoading: boolean
  joinCodeValue: string
  onJoinCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
}

export function JoinCodeStep({
  form,
  error,
  isLoading,
  joinCodeValue,
  onJoinCodeChange,
  onSubmit,
}: JoinCodeStepProps) {
  const t = useTranslations('onboarding.joinChurch.codeStep')
  const tErrors = useTranslations('onboarding.errors')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  // Translate error if it's a known key, otherwise display as-is
  const translatedError = error
    ? (error === 'churchNotFound' || error === 'generic')
      ? tErrors(error)
      : error
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {translatedError && (
        <Alert variant="destructive">
          <AlertDescription>{translatedError}</AlertDescription>
        </Alert>
      )}

      {/* Join Code Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold">{t('sectionTitle')}</h3>
        </div>

        <div className="space-y-3">
          <Label htmlFor="joinCode" className="sr-only">
            {t('sectionTitle')}
          </Label>
          <Input
            id="joinCode"
            placeholder={t('placeholder')}
            {...register('joinCode')}
            onChange={onJoinCodeChange}
            value={joinCodeValue}
            disabled={isLoading}
            className="text-center text-2xl font-mono tracking-[0.5em] uppercase h-16 border-2"
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <p className="text-sm text-muted-foreground text-center">
            {t('hint')}
          </p>
          {errors.joinCode && (
            <p className="text-sm text-red-500 text-center">
              {errors.joinCode.message}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !border-0 gap-2 order-2 sm:order-1"
          asChild
        >
          <Link href="/onboarding">
            <ArrowLeft className="w-5 h-5" />
            {t('back')}
          </Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground gap-2 order-1 sm:order-2"
          disabled={isLoading || joinCodeValue.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('validating')}
            </>
          ) : (
            <>
              {t('continue')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
