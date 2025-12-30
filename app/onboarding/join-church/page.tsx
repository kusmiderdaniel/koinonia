'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { joinChurch } from '../actions'
import { joinChurchSchema, type JoinChurchInput } from '@/lib/validations/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const formSchema = joinChurchSchema.extend({
  phone: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function JoinChurchPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const joinCodeValue = watch('joinCode') || ''

  // Handle join code input - auto-uppercase and limit to 6 characters
  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setValue('joinCode', value, { shouldValidate: value.length === 6 })
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await joinChurch(data)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      } else if (result?.success) {
        if (result?.pending) {
          router.push('/auth/pending-approval')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Your Church</CardTitle>
          <CardDescription>
            Enter the 6-character join code from your church admin
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
              <div className="space-y-2">
                <Label htmlFor="joinCode" className="sr-only">Join Code</Label>
                <Input
                  id="joinCode"
                  placeholder="ABC123"
                  {...register('joinCode')}
                  onChange={handleJoinCodeChange}
                  value={joinCodeValue}
                  disabled={isLoading}
                  className="text-center text-2xl font-mono tracking-[0.5em] uppercase h-14"
                  maxLength={6}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Example: 6YU94P
                </p>
                {errors.joinCode && (
                  <p className="text-sm text-red-500 text-center">{errors.joinCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  disabled={isLoading}
                />
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
                disabled={isLoading || joinCodeValue.length !== 6}
              >
                {isLoading ? 'Joining...' : 'Join Church'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
