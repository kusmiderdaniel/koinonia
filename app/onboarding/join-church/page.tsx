'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { joinChurch, getCampusesByJoinCode } from '../actions'
import { joinChurchSchema, type JoinChurchInput } from '@/lib/validations/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const formSchema = joinChurchSchema.extend({
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  campusId: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CampusInfo {
  id: string
  name: string
  color: string
  is_default: boolean
}

interface ChurchInfo {
  id: string
  name: string
}

type Step = 'code' | 'campus'

export default function JoinChurchPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<Step>('code')
  const [churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null)
  const [campuses, setCampuses] = useState<CampusInfo[]>([])
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null)

  // Profile fields state
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | ''>()

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

  const handleValidateCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await getCampusesByJoinCode(joinCodeValue)
      if (result?.error) {
        setError(result.error === 'Church not found'
          ? 'Church not found. Please check the join code and try again.'
          : result.error)
        setIsLoading(false)
        return
      }

      if (result?.church && result?.campuses) {
        setChurchInfo(result.church)
        setCampuses(result.campuses)

        // Auto-select default campus if only one exists
        if (result.campuses.length === 1) {
          setSelectedCampusId(result.campuses[0].id)
        } else {
          // Select the default campus initially
          const defaultCampus = result.campuses.find(c => c.is_default)
          if (defaultCampus) {
            setSelectedCampusId(defaultCampus.id)
          }
        }

        // If multiple campuses, show campus selection step
        if (result.campuses.length > 1) {
          setStep('campus')
        } else {
          // Only one campus, submit directly
          await submitRegistration(result.campuses[0]?.id)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const submitRegistration = async (campusId?: string) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await joinChurch({
        joinCode: joinCodeValue,
        campusId: campusId || selectedCampusId || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        sex: sex || undefined,
      })
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

  const onSubmitCode = async (data: FormData) => {
    await handleValidateCode()
  }

  const onSubmitCampus = async () => {
    await submitRegistration()
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const handleBack = () => {
    if (step === 'campus') {
      setStep('code')
      setChurchInfo(null)
      setCampuses([])
      setSelectedCampusId(null)
    }
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
          <CardTitle className="text-2xl font-bold">
            {step === 'code' ? 'Join Your Church' : `Join ${churchInfo?.name}`}
          </CardTitle>
          <CardDescription>
            {step === 'code'
              ? 'Enter the 6-character join code from your church admin'
              : 'Complete your profile to join the church'
            }
          </CardDescription>
        </CardHeader>

        {step === 'code' ? (
          <form onSubmit={handleSubmit(onSubmitCode)}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
        ) : (
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Campus Selection */}
            {campuses.length > 1 && (
              <div className="space-y-3">
                <Label>Select your campus</Label>
                <RadioGroup
                  value={selectedCampusId || ''}
                  onValueChange={setSelectedCampusId}
                  className="space-y-2"
                >
                  {campuses.map((campus) => (
                    <div
                      key={campus.id}
                      className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedCampusId(campus.id)}
                    >
                      <RadioGroupItem value={campus.id} id={campus.id} />
                      <Label
                        htmlFor={campus.id}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: campus.color }}
                        />
                        <span className="font-medium">{campus.name}</span>
                        {campus.is_default && (
                          <span className="text-xs text-muted-foreground">(Main)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Profile Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={sex} onValueChange={(value) => setSex(value as 'male' | 'female')}>
                  <SelectTrigger className="bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline-pill"
                className="flex-1"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 !rounded-full !bg-brand hover:!bg-brand/90 text-white"
                disabled={isLoading || (campuses.length > 1 && !selectedCampusId)}
                onClick={onSubmitCampus}
              >
                {isLoading ? 'Joining...' : 'Join Church'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
