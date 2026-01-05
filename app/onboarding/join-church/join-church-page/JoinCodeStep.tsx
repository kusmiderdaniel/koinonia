'use client'

import Link from 'next/link'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronRight } from 'lucide-react'
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="joinCode" className="sr-only">
            Join Code
          </Label>
          <Input
            id="joinCode"
            placeholder="ABC123"
            {...register('joinCode')}
            onChange={onJoinCodeChange}
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
            <p className="text-sm text-red-500 text-center">
              {errors.joinCode.message}
            </p>
          )}
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
            {isLoading ? 'Validating...' : 'Continue'}
            {!isLoading && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </form>
  )
}
