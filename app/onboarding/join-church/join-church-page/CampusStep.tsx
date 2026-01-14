'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { ArrowLeft, Loader2, MapPin, User } from 'lucide-react'
import { DataSharingPreview } from '@/components/legal'
import type { CampusInfo } from './types'

interface CampusStepProps {
  error: string | null
  isLoading: boolean
  campuses: CampusInfo[]
  selectedCampusId: string | null
  onSelectedCampusIdChange: (id: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  dateOfBirth: string
  onDateOfBirthChange: (value: string) => void
  sex: 'male' | 'female' | '' | undefined
  onSexChange: (value: 'male' | 'female') => void
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  churchName: string
  dataSharingConsent: boolean
  onDataSharingConsentChange: (checked: boolean) => void
  consentError: string | null
  onBack: () => void
  onSubmit: () => void
}

export function CampusStep({
  error,
  isLoading,
  campuses,
  selectedCampusId,
  onSelectedCampusIdChange,
  phone,
  onPhoneChange,
  dateOfBirth,
  onDateOfBirthChange,
  sex,
  onSexChange,
  weekStartsOn,
  churchName,
  dataSharingConsent,
  onDataSharingConsentChange,
  consentError,
  onBack,
  onSubmit,
}: CampusStepProps) {
  const t = useTranslations('onboarding.joinChurch.campusStep')
  const tErrors = useTranslations('onboarding.errors')
  const tLegal = useTranslations('legal')

  // Translate error if it's a known key, otherwise display as-is
  const translatedError = error
    ? (error === 'churchNotFound' || error === 'generic')
      ? tErrors(error)
      : error
    : null

  return (
    <div className="space-y-8">
      {translatedError && (
        <Alert variant="destructive">
          <AlertDescription>{translatedError}</AlertDescription>
        </Alert>
      )}

      {/* Campus Selection */}
      {campuses.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold">{t('selectCampus.title')}</h3>
          </div>

          <RadioGroup
            value={selectedCampusId || ''}
            onValueChange={onSelectedCampusIdChange}
            className="space-y-2"
          >
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:border-brand"
                onClick={() => onSelectedCampusIdChange(campus.id)}
                data-state={selectedCampusId === campus.id ? 'checked' : 'unchecked'}
              >
                <RadioGroupItem value={campus.id} id={campus.id} />
                <Label
                  htmlFor={campus.id}
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: campus.color }}
                  />
                  <div>
                    <span className="font-medium">{campus.name}</span>
                    {campus.is_default && (
                      <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {t('selectCampus.mainCampus')}
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Profile Information */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold">{t('profileInfo.title')} <span className="font-normal text-muted-foreground text-sm">{t('profileInfo.optional')}</span></h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t('profileInfo.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('profileInfo.phonePlaceholder')}
              className="h-11"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t('profileInfo.dateOfBirth')}</Label>
              <DatePicker
                id="dateOfBirth"
                value={dateOfBirth}
                onChange={onDateOfBirthChange}
                placeholder={t('profileInfo.dateOfBirthPlaceholder')}
                disabled={isLoading}
                weekStartsOn={weekStartsOn}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">{t('profileInfo.gender')}</Label>
              <Select value={sex} onValueChange={onSexChange}>
                <SelectTrigger className="h-11 bg-white dark:bg-zinc-950">
                  <SelectValue placeholder={t('profileInfo.genderPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950" style={{ borderColor: '#18181b', borderWidth: '1px' }}>
                  <SelectItem value="male">{t('profileInfo.male')}</SelectItem>
                  <SelectItem value="female">{t('profileInfo.female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sharing Consent */}
      <DataSharingPreview
        churchName={churchName}
        checked={dataSharingConsent}
        onCheckedChange={onDataSharingConsentChange}
        error={consentError ? tLegal('dataSharing.consentRequired') : undefined}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !border-2 !border-black dark:!border-white gap-2 order-2 sm:order-1"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5" />
          {t('back')}
        </Button>
        <Button
          type="button"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !bg-brand hover:!bg-brand/90 text-white order-1 sm:order-2"
          disabled={isLoading || (campuses.length > 1 && !selectedCampusId) || !dataSharingConsent}
          onClick={onSubmit}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </div>
    </div>
  )
}
