'use client'

import { UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import type { ProfileInput } from './types'

interface PersonalInfoCardProps {
  form: UseFormReturn<ProfileInput>
  email: string
  sex: string | undefined
  dateOfBirth: string
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isLoading: boolean
  onSubmit: (data: ProfileInput) => void
  onDateOfBirthChange: (value: string) => void
  onSexChange: (value: string) => void
}

export function PersonalInfoCard({
  form,
  email,
  sex,
  dateOfBirth,
  firstDayOfWeek,
  isLoading,
  onSubmit,
  onDateOfBirthChange,
  onSexChange,
}: PersonalInfoCardProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your name and contact details</CardDescription>
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
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
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
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
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
                onChange={onDateOfBirthChange}
                placeholder="Select date"
                disabled={isLoading}
                weekStartsOn={firstDayOfWeek}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Gender</Label>
              <Select
                value={sex}
                onValueChange={onSexChange}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="sex"
                  className="w-full bg-white dark:bg-zinc-950 border border-input"
                >
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  className="bg-white dark:bg-zinc-950 border border-input"
                >
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
  )
}
