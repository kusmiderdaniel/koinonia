'use client'

import { memo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, X, Church } from 'lucide-react'
import { toast } from 'sonner'
import { uploadChurchLogo, removeChurchLogo } from '../actions'
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
  logoUrl: string | null
  onLogoChange: (url: string | null) => void
  onSubmit: (data: ChurchDetailsFormData) => Promise<void>
}

export const ChurchDetailsTab = memo(function ChurchDetailsTab({
  form,
  isLoading,
  isAdmin,
  logoUrl,
  onLogoChange,
  onSubmit,
}: ChurchDetailsTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadChurchLogo(formData)

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      onLogoChange(result.data.logoUrl)
      toast.success('Logo uploaded successfully')
    }

    setIsUploadingLogo(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setIsRemovingLogo(true)
    const result = await removeChurchLogo()

    if (result.error) {
      toast.error(result.error)
    } else {
      onLogoChange(null)
      toast.success('Logo removed')
    }

    setIsRemovingLogo(false)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex justify-center">
          <div className="space-y-6 w-full max-w-md">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label>Church Logo</Label>
            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="relative w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Church logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Church className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>

              {/* Upload/Remove Buttons */}
              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo || isRemovingLogo}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo || isRemovingLogo}
                    className="!rounded-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo || isRemovingLogo}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 !rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {isRemovingLogo ? 'Removing...' : 'Remove'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, at least 200x200px. Max 5MB. Supported formats: JPEG, PNG, WebP, GIF.
            </p>
          </div>

          <Separator />

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
