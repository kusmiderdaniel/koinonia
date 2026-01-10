import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getProfile, updateProfile, changePassword, updateNotificationPreferences } from '../actions'
import { profileSchema, type ProfileInput } from './types'
import {
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notification-preferences'
import { type Locale } from '@/lib/i18n/config'

export function useProfilePageState() {
  // Profile state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [email, setEmail] = useState('')
  const [sex, setSex] = useState<string | undefined>(undefined)
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0)
  const [userRole, setUserRole] = useState<string>('')
  const [language, setLanguage] = useState<Locale | null>(null)

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  const { reset, setValue } = form

  useEffect(() => {
    async function loadProfile() {
      const result = await getProfile()
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setEmail(result.data.email)
        setSex(result.data.sex || undefined)
        setDateOfBirth(result.data.date_of_birth || '')
        if (result.firstDayOfWeek !== undefined) {
          setFirstDayOfWeek(result.firstDayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6)
        }
        if (result.role) {
          setUserRole(result.role)
        }
        if (result.data.notification_preferences) {
          setNotificationPreferences(result.data.notification_preferences)
        }
        if (result.data.language) {
          setLanguage(result.data.language as Locale)
        }
        reset({
          firstName: result.data.first_name,
          lastName: result.data.last_name,
          phone: result.data.phone || '',
          dateOfBirth: result.data.date_of_birth || '',
          sex: result.data.sex as 'male' | 'female' | null | undefined,
        })
      }
      setIsLoadingData(false)
    }
    loadProfile()
  }, [reset])

  const onSubmit = useCallback(
    async (data: ProfileInput) => {
      setError(null)
      setSuccess(null)
      setIsLoading(true)

      try {
        const result = await updateProfile({
          ...data,
          dateOfBirth,
          sex: sex as 'male' | 'female' | undefined,
        })
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccess('Profile updated successfully!')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    },
    [dateOfBirth, sex]
  )

  const handlePasswordChange = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setPasswordError(null)
      setPasswordSuccess(null)

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match')
        return
      }

      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters')
        return
      }

      setIsChangingPassword(true)

      try {
        const result = await changePassword(currentPassword, newPassword)
        if (result.error) {
          setPasswordError(result.error)
        } else {
          setPasswordSuccess('Password changed successfully!')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setShowPasswordForm(false)
        }
      } catch {
        setPasswordError('Failed to change password')
      } finally {
        setIsChangingPassword(false)
      }
    },
    [currentPassword, newPassword, confirmPassword]
  )

  const handleCancelPasswordChange = useCallback(() => {
    setShowPasswordForm(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }, [])

  const handleDateOfBirthChange = useCallback(
    (value: string) => {
      setDateOfBirth(value)
      setValue('dateOfBirth', value)
    },
    [setValue]
  )

  const handleSexChange = useCallback(
    (value: string) => {
      setSex(value)
      setValue('sex', value as 'male' | 'female')
    },
    [setValue]
  )

  const handleNotificationPreferencesChange = useCallback(
    (preferences: NotificationPreferences) => {
      setNotificationPreferences(preferences)
    },
    []
  )

  const handleSaveNotificationPreferences = useCallback(async () => {
    setNotificationError(null)
    setNotificationSuccess(null)
    setIsUpdatingNotifications(true)

    try {
      const result = await updateNotificationPreferences(notificationPreferences)
      if (result.error) {
        setNotificationError(result.error)
      } else {
        setNotificationSuccess('Notification settings saved!')
        // Clear success message after 3 seconds
        setTimeout(() => setNotificationSuccess(null), 3000)
      }
    } catch {
      setNotificationError('Failed to save notification settings')
    } finally {
      setIsUpdatingNotifications(false)
    }
  }, [notificationPreferences])

  return {
    // Form
    form,
    onSubmit,

    // Profile state
    error,
    success,
    isLoading,
    isLoadingData,
    email,
    sex,
    dateOfBirth,
    firstDayOfWeek,
    userRole,
    language,

    // Profile handlers
    handleDateOfBirthChange,
    handleSexChange,

    // Notification preferences state
    notificationPreferences,
    isUpdatingNotifications,
    notificationSuccess,
    notificationError,

    // Notification preferences handlers
    handleNotificationPreferencesChange,
    handleSaveNotificationPreferences,

    // Password state
    showPasswordForm,
    setShowPasswordForm,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    isChangingPassword,
    passwordError,
    passwordSuccess,

    // Password handlers
    handlePasswordChange,
    handleCancelPasswordChange,
  }
}
