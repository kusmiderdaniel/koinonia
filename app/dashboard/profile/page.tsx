'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/LoadingState'
import { Eye, EyeOff } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { getProfile, updateProfile, changePassword } from './actions'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.enum(['male', 'female']).optional().nullable(),
})

type ProfileInput = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [email, setEmail] = useState('')
  const [sex, setSex] = useState<string | undefined>(undefined)
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0)

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

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

  const onSubmit = async (data: ProfileInput) => {
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
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
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
  }

  if (isLoadingData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your name and contact details
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <DatePicker
                    id="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(value) => {
                      setDateOfBirth(value)
                      setValue('dateOfBirth', value)
                    }}
                    placeholder="Select date"
                    disabled={isLoading}
                    weekStartsOn={firstDayOfWeek}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <Select
                    value={sex}
                    onValueChange={(value) => {
                      setSex(value)
                      setValue('sex', value as 'male' | 'female')
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="sex" className="w-full bg-white dark:bg-zinc-950 border border-input">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="bg-white dark:bg-zinc-950 border border-input">
                      <SelectItem
                        value="male"
                        className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                      >
                        Male
                      </SelectItem>
                      <SelectItem
                        value="female"
                        className="cursor-pointer [&>span.absolute]:hidden hover:!bg-gray-50 dark:hover:!bg-zinc-800/50 data-[state=checked]:!bg-gray-100 dark:data-[state=checked]:!bg-zinc-800 data-[state=checked]:font-medium"
                      >
                        Female
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            {passwordSuccess && (
              <Alert className="mb-4 border-green-500 text-green-700">
                <AlertDescription>{passwordSuccess}</AlertDescription>
              </Alert>
            )}

            {!showPasswordForm ? (
              <div className="p-4 border border-border rounded-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4 p-4 border border-border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isChangingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
                  >
                    {isChangingPassword ? 'Changing...' : 'Update Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setPasswordError(null)
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
