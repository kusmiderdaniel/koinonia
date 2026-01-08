'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createChurch, checkSubdomainAvailability } from '../actions'
import { createChurchSchema, type CreateChurchInput } from '@/lib/validations/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Loader2, Building2, ArrowLeft, LogOut, Globe, MapPin, Mail } from 'lucide-react'

// Helper function to generate a URL-safe slug from a string
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .substring(0, 30)         // Limit length
}

export default function CreateChurchPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [subdomainError, setSubdomainError] = useState<string | null>(null)
  const [hasManuallyEditedSubdomain, setHasManuallyEditedSubdomain] = useState(false)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateChurchInput>({
    resolver: zodResolver(createChurchSchema),
    defaultValues: {
      country: 'USA',
      timezone: 'America/New_York',
      subdomain: '',
    },
  })

  const churchName = watch('name')
  const subdomain = watch('subdomain')

  // Auto-populate subdomain when church name changes (if not manually edited)
  useEffect(() => {
    if (churchName && !hasManuallyEditedSubdomain) {
      const slug = slugify(churchName)
      if (slug) {
        setValue('subdomain', slug)
      }
    }
  }, [churchName, hasManuallyEditedSubdomain, setValue])

  // Debounced availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setSubdomainStatus('idle')
      setSubdomainError(null)
      return
    }

    setSubdomainStatus('checking')
    setSubdomainError(null)

    const result = await checkSubdomainAvailability(value)

    if (result.available) {
      setSubdomainStatus('available')
      setSubdomainError(null)
    } else {
      setSubdomainStatus('unavailable')
      setSubdomainError(result.error || 'This subdomain is not available')
    }
  }, [])

  // Check availability when subdomain changes (debounced)
  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }

    if (subdomain && subdomain.length >= 3) {
      setSubdomainStatus('checking')
      checkTimeoutRef.current = setTimeout(() => {
        checkAvailability(subdomain)
      }, 500)
    } else {
      setSubdomainStatus('idle')
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [subdomain, checkAvailability])

  const onSubmit = async (data: CreateChurchInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await createChurch(data)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand/5 via-background to-background">
      {/* Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-16 sm:px-6">
        <div className="w-full max-w-2xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 mb-2">
              <Building2 className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Create Your Church
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Set up your church organization and start inviting your team
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-2">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Basic Info Section */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-brand" />
                    </div>
                    <h3 className="font-semibold">Basic Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Church Name *</Label>
                    <Input
                      id="name"
                      placeholder="First Baptist Church"
                      className="h-11"
                      {...register('name')}
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Your Church URL *</Label>
                    <div className="flex items-center gap-0">
                      <div className="relative flex-1">
                        <Input
                          id="subdomain"
                          placeholder="your-church"
                          {...register('subdomain', {
                            onChange: () => setHasManuallyEditedSubdomain(true)
                          })}
                          disabled={isLoading}
                          className="h-11 pr-10 rounded-r-none border-r-0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {subdomainStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {subdomainStatus === 'available' && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {subdomainStatus === 'unavailable' && (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground bg-muted px-3 h-11 flex items-center border rounded-r-md">
                        .koinonia.app
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p className="text-sm text-red-500">{errors.subdomain.message}</p>
                    )}
                    {!errors.subdomain && subdomainError && (
                      <p className="text-sm text-red-500">{subdomainError}</p>
                    )}
                    {subdomainStatus === 'available' && (
                      <p className="text-sm text-green-600">This subdomain is available!</p>
                    )}
                  </div>
                </div>

                {/* Contact Section */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold">Contact Information</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Church Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@yourchurch.org"
                        className="h-11"
                        {...register('email')}
                        disabled={isLoading}
                        required
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Church Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="h-11"
                        {...register('phone')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">Location <span className="font-normal text-muted-foreground text-sm">(Optional)</span></h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      className="h-11"
                      {...register('address')}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        className="h-11"
                        {...register('city')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        className="h-11"
                        {...register('zipCode')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        className="h-11"
                        {...register('country')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="sm:flex-1 h-14 text-base !rounded-full !border-2 !border-black dark:!border-white gap-2 order-2 sm:order-1"
                    asChild
                  >
                    <Link href="/onboarding">
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="sm:flex-1 h-14 text-base !rounded-full !bg-brand hover:!bg-brand/90 text-white order-1 sm:order-2"
                    disabled={isLoading || subdomainStatus === 'unavailable' || subdomainStatus === 'checking'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Church'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@koinonia.app" className="text-brand hover:underline">
              support@koinonia.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
