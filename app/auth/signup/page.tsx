'use client'

import { Suspense, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { signUp } from '../actions'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConsentCheckbox } from '@/components/legal'

function SignUpContent() {
  const t = useTranslations('auth.signup')
  const tErrors = useTranslations('auth.errors')
  const tSuccess = useTranslations('auth.success')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      acceptTerms: false as unknown as true,
      acceptPrivacy: false as unknown as true,
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const result = await signUp(data)
      if (result?.error) {
        // Error is now a translation key
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('firstName')}</Label>
              <Input
                id="firstName"
                placeholder={t('firstNamePlaceholder')}
                className="h-11"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                placeholder={t('lastNamePlaceholder')}
                className="h-11"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              className="h-11 focus:placeholder-transparent"
              {...register('password')}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t('passwordHint')}
            </p>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              className="h-11 focus:placeholder-transparent"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Legal Consent Checkboxes */}
          <div className="space-y-3 pt-2">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <ConsentCheckbox
                  documentType="terms_of_service"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  error={errors.acceptTerms?.message}
                  disabled={isLoading}
                />
              )}
            />

            <Controller
              name="acceptPrivacy"
              control={control}
              render={({ field }) => (
                <ConsentCheckbox
                  documentType="privacy_policy"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  error={errors.acceptPrivacy?.message}
                  disabled={isLoading}
                />
              )}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t-0 bg-transparent px-0 sm:px-6 pt-2">
          <Button type="submit" className="w-full h-11 !rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground" disabled={isLoading}>
            {isLoading ? t('submitting') : t('submitButton')}
          </Button>

          {/* Google OAuth - hidden until configured
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 !rounded-full !border !border-black dark:!border-white"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            {t('continueWithGoogle')}
          </Button>
          */}

          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href="/auth/signin" className="text-brand font-semibold hover:underline">
              {t('signinLink')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function SignUpPage() {
  const tCommon = useTranslations('common')

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm"><CardContent className="p-6">{tCommon('loading.default')}</CardContent></Card>}>
        <SignUpContent />
      </Suspense>
    </div>
  )
}
