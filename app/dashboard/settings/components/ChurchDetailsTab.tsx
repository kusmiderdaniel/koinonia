'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { UseFormReturn } from 'react-hook-form'

interface ChurchDetailsFormData {
  name: string
  email?: string
  phone?: string
  website?: string
  address?: string
  country?: string
  city?: string
  zipCode?: string
}

interface ChurchDetailsTabProps {
  form: UseFormReturn<ChurchDetailsFormData>
  isLoading: boolean
  isAdmin: boolean
  churchData: { role: string } | null
  onSubmit: (data: ChurchDetailsFormData) => Promise<void>
}

export const ChurchDetailsTab = memo(function ChurchDetailsTab({
  form,
  isLoading,
  isAdmin,
  onSubmit,
}: ChurchDetailsTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex justify-center">
          <div className="space-y-6 w-full max-w-md">
          <div className="space-y-2">
            <Label htmlFor="name">Church Name *</Label>
            <Input id="name" {...register('name')} disabled={isLoading || !isAdmin} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Church Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@yourchurch.org"
                {...register('email')}
                disabled={isLoading || !isAdmin}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
                disabled={isLoading || !isAdmin}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourchurch.org"
              {...register('website')}
              disabled={isLoading || !isAdmin}
            />
            {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              {...register('address')}
              disabled={isLoading || !isAdmin}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register('country')} disabled={isLoading || !isAdmin} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} disabled={isLoading || !isAdmin} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input id="zipCode" {...register('zipCode')} disabled={isLoading || !isAdmin} />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
          </div>
        </CardContent>
      </form>
    </Card>
  )
})
