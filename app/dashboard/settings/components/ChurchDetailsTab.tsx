'use client'

import { memo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Upload, X, Church, Palette, Check } from 'lucide-react'
import { toast } from 'sonner'
import { uploadChurchLogo, removeChurchLogo, updateBrandColor } from '../actions'
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
  brandColor: string | null
  onLogoChange: (url: string | null) => void
  onBrandColorChange: (color: string | null) => void
  onSubmit: (data: ChurchDetailsFormData) => Promise<void>
}

const DEFAULT_BRAND_COLOR = '#f49f1e'

const PRESET_COLORS = [
  '#f49f1e', // Orange (default)
  '#3b82f6', // Blue
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#84cc16', // Lime
]

export const ChurchDetailsTab = memo(function ChurchDetailsTab({
  form,
  isLoading,
  isAdmin,
  logoUrl,
  brandColor,
  onLogoChange,
  onBrandColorChange,
  onSubmit,
}: ChurchDetailsTabProps) {
  const t = useTranslations('settings.details')
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isRemovingLogo, setIsRemovingLogo] = useState(false)
  const [isSavingColor, setIsSavingColor] = useState(false)
  const [customColor, setCustomColor] = useState(brandColor || DEFAULT_BRAND_COLOR)

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
      toast.success(t('logo.uploadSuccess'))
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
      toast.success(t('logo.removeSuccess'))
    }

    setIsRemovingLogo(false)
  }

  const handleBrandColorChange = async (color: string) => {
    setIsSavingColor(true)
    setCustomColor(color)
    const result = await updateBrandColor(color)

    if (result.error) {
      toast.error(result.error)
    } else {
      onBrandColorChange(color)
      toast.success(t('brandColor.saveSuccess'))
      router.refresh()
    }

    setIsSavingColor(false)
  }

  return (
    <Card className="w-full md:min-w-[28rem] border-0 shadow-none !ring-0">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-3 md:p-6">
          <div className="space-y-4">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label>{t('logo.label')}</Label>
            <div className="border border-black/20 dark:border-white/20 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Logo Preview */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Church logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Church className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/50" />
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
                      className="!rounded-lg !border-black/20 dark:!border-white/20 text-xs md:text-sm"
                    >
                      <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      {isUploadingLogo ? t('logo.uploading') : t('logo.upload')}
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={isUploadingLogo || isRemovingLogo}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 !rounded-lg !border-red-300 dark:!border-red-800 text-xs md:text-sm"
                      >
                        <X className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        {isRemovingLogo ? t('logo.removing') : t('logo.remove')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {t('logo.hint')}
              </p>
            </div>
          </div>

          {/* Brand Color Section */}
          {isAdmin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('brandColor.label')}
              </Label>
              <div className="border border-black/20 dark:border-white/20 rounded-lg p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleBrandColorChange(color)}
                      disabled={isSavingColor}
                      className="relative w-8 h-8 rounded-full border-2 border-transparent hover:border-black dark:hover:border-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {(brandColor || DEFAULT_BRAND_COLOR) === color && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      disabled={isSavingColor}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
                    />
                    <Input
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#f49f1e"
                      className="flex-1 uppercase font-mono text-sm"
                      disabled={isSavingColor}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleBrandColorChange(customColor)}
                    disabled={isSavingColor || customColor === brandColor}
                    className="!rounded-lg !border-black dark:!border-white text-xs md:text-sm"
                  >
                    {isSavingColor ? t('brandColor.saving') : t('brandColor.apply')}
                  </Button>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  {t('brandColor.hint')}
                </p>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input id="name" {...register('name')} disabled={isLoading || !isAdmin} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                {...register('email')}
                disabled={isLoading || !isAdmin}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('phonePlaceholder')}
                {...register('phone')}
                disabled={isLoading || !isAdmin}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{t('website')}</Label>
            <Input
              id="website"
              type="url"
              placeholder={t('websitePlaceholder')}
              {...register('website')}
              disabled={isLoading || !isAdmin}
            />
            {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address">{t('address')}</Label>
            <Input
              id="address"
              placeholder={t('addressPlaceholder')}
              {...register('address')}
              disabled={isLoading || !isAdmin}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('country')}</Label>
              <Input id="country" {...register('country')} disabled={isLoading || !isAdmin} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">{t('city')}</Label>
              <Input id="city" {...register('city')} disabled={isLoading || !isAdmin} />
            </div>

            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="zipCode">{t('zipCode')}</Label>
              <Input id="zipCode" {...register('zipCode')} disabled={isLoading || !isAdmin} />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading} className="!rounded-lg !border !border-brand !bg-brand hover:!bg-brand/90 !text-white dark:!text-black">
                {isLoading ? t('saving') : t('saveChanges')}
              </Button>
            </div>
          )}
          </div>
        </CardContent>
      </form>
    </Card>
  )
})
