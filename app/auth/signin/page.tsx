'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { signIn } from '../actions'
import { signInSchema, type SignInInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignInPage() {
  const t = useTranslations('auth.signin')
  const tErrors = useTranslations('auth.errors')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn(data)
      if (result?.error) {
        // Error is now a translation key
        setError(tErrors(result.error))
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
                placeholder="••••••••"
                className="h-11 focus:placeholder-transparent"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              <Link
                href="/auth/reset-password"
                className="text-sm text-brand hover:underline inline-block"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t-0 bg-transparent px-0 sm:px-6 pt-2">
            <Button type="submit" className="w-full h-11 !rounded-full !bg-brand hover:!bg-brand/90 text-white" disabled={isLoading}>
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
              {t('noAccount')}{' '}
              <Link href="/auth/signup" className="text-brand font-semibold hover:underline">
                {t('signupLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
