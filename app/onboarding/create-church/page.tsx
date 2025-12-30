'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createChurch } from '../actions'
import { createChurchSchema, type CreateChurchInput } from '@/lib/validations/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'

export default function CreateChurchPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateChurchInput>({
    resolver: zodResolver(createChurchSchema),
    defaultValues: {
      country: 'USA',
      timezone: 'America/New_York',
    },
  })

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <Button variant="outline-pill" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Your Church</CardTitle>
          <CardDescription>
            Set up your church organization and become the administrator
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Church Information</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Church Name *</Label>
                <Input
                  id="name"
                  placeholder="First Baptist Church"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Church Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@yourchurch.org"
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
                    {...register('phone')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  {...register('address')}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    {...register('zipCode')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline-pill"
                className="flex-1"
                asChild
              >
                <Link href="/onboarding">Back</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1 !rounded-full !bg-brand hover:!bg-brand/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Church'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
