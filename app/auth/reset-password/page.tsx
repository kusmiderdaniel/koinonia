'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { resetPassword } from '../actions'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword')
  const tErrors = useTranslations('auth.errors')
  const tSuccess = useTranslations('auth.success')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const result = await resetPassword(data)
      if (result?.error) {
        setError(tErrors(result.error))
      } else if (result?.success && result?.messageKey) {
        setSuccess(tSuccess(result.messageKey))
      }
    } catch {
      setError(tErrors('generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="space-y-1 px-0 sm:px-6 sm:pt-6">
          <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 px-0 sm:px-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                className="h-11"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t-0 bg-transparent px-0 sm:px-6 pt-2">
            <Button type="submit" className="w-full h-11 !rounded-full !bg-brand hover:!bg-brand/90 text-white" disabled={isLoading}>
              {isLoading ? t('submitting') : t('submitButton')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('backToSignin')}{' '}
              <Link href="/auth/signin" className="text-brand font-semibold hover:underline">
                {t('signinLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
