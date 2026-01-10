import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { joinChurch, getCampusesByJoinCode } from '../../actions'
import { createClient } from '@/lib/supabase/client'
import { formSchema, type FormData, type CampusInfo, type ChurchInfo, type Step } from './types'

export function useJoinChurchPageState() {
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const { setValue, watch } = form
  const joinCodeValue = watch('joinCode') || ''

  const handleJoinCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6)
      setValue('joinCode', value, { shouldValidate: value.length === 6 })
    },
    [setValue]
  )

  const submitRegistration = useCallback(
    async (campusId?: string) => {
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
      } catch {
        setError('generic')
        setIsLoading(false)
      }
    },
    [joinCodeValue, selectedCampusId, phone, dateOfBirth, sex, router]
  )

  const handleValidateCode = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await getCampusesByJoinCode(joinCodeValue)
      if (result?.error) {
        // Return error key for translation
        setError(
          result.error === 'Church not found'
            ? 'churchNotFound'
            : result.error
        )
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
          const defaultCampus = result.campuses.find((c) => c.is_default)
          if (defaultCampus) {
            setSelectedCampusId(defaultCampus.id)
          }
        }

        // Always show the profile step so users can fill in their info
        setStep('campus')
      }
    } catch {
      setError('generic')
    } finally {
      setIsLoading(false)
    }
  }, [joinCodeValue, submitRegistration])

  const onSubmitCode = useCallback(async () => {
    await handleValidateCode()
  }, [handleValidateCode])

  const onSubmitCampus = useCallback(async () => {
    await submitRegistration()
  }, [submitRegistration])

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }, [router])

  const handleBack = useCallback(() => {
    if (step === 'campus') {
      setStep('code')
      setChurchInfo(null)
      setCampuses([])
      setSelectedCampusId(null)
    }
  }, [step])

  return {
    form,
    error,
    isLoading,
    step,
    churchInfo,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    phone,
    setPhone,
    dateOfBirth,
    setDateOfBirth,
    sex,
    setSex,
    joinCodeValue,
    handleJoinCodeChange,
    onSubmitCode,
    onSubmitCampus,
    handleSignOut,
    handleBack,
  }
}
