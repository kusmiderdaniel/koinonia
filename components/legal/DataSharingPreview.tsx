'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import {
  User,
  Mail,
  Phone,
  Users,
  Calendar,
  FileText,
  Settings,
  Shield,
  Info,
} from 'lucide-react'

interface DataCategory {
  key: string
  icon: React.ReactNode
  required: boolean
}

const dataCategories: DataCategory[] = [
  { key: 'name', icon: <User className="h-4 w-4" />, required: true },
  { key: 'email', icon: <Mail className="h-4 w-4" />, required: true },
  { key: 'phone', icon: <Phone className="h-4 w-4" />, required: false },
  { key: 'ministryAssignments', icon: <Users className="h-4 w-4" />, required: true },
  { key: 'eventParticipation', icon: <Calendar className="h-4 w-4" />, required: true },
  { key: 'formResponses', icon: <FileText className="h-4 w-4" />, required: true },
  { key: 'customFields', icon: <Settings className="h-4 w-4" />, required: false },
]

interface DataSharingPreviewProps {
  churchName: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  error?: string
  className?: string
}

export function DataSharingPreview({
  churchName,
  checked,
  onCheckedChange,
  error,
  className,
}: DataSharingPreviewProps) {
  const t = useTranslations('legal.dataSharing')

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('title')}</CardTitle>
        </div>
        <CardDescription>
          {t('description', { churchName })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t('whatIsShared')}</h4>
          <div className="grid gap-2">
            {dataCategories.map((category) => (
              <div
                key={category.key}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="text-muted-foreground mt-0.5">
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t(category.key)}
                    </span>
                    <Badge variant={category.required ? 'default' : 'outline'} className="text-xs">
                      {category.required ? t('required') : t('optional')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`${category.key}Description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who Can See */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>{t('whoCanSee')}</strong>
            <p className="mt-1 text-muted-foreground">
              {t('whoCanSeeDescription')}
            </p>
          </AlertDescription>
        </Alert>

        {/* Data Controller Info */}
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{t('dataController')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('dataControllerDescription', { churchName })}
              </p>
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2 border-t">
          <div className="flex items-start gap-3">
            <Checkbox
              id="data-sharing-consent"
              checked={checked}
              onCheckedChange={(value) => onCheckedChange(value === true)}
              className="mt-0.5"
              aria-invalid={!!error}
            />
            <Label
              htmlFor="data-sharing-consent"
              className={cn(
                'text-sm leading-relaxed cursor-pointer',
                error && 'text-destructive'
              )}
            >
              {t('title') === 'Data Sharing with Your Church'
                ? `I consent to sharing my data with ${churchName}`
                : t('title') === 'Udostępnianie Danych Twojemu Kościołowi'
                ? `Wyrażam zgodę na udostępnienie moich danych ${churchName}`
                : `I consent to sharing my data with ${churchName}`
              }
            </Label>
          </div>
          {error && (
            <p className="text-destructive text-xs ml-7 mt-1">{error}</p>
          )}
          <p className="text-xs text-muted-foreground ml-7 mt-2">
            {t('withdrawConsent')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Returns the list of data categories that will be shared
 * Used for recording consent with specific categories
 */
export function getDataSharingCategories(): string[] {
  return dataCategories.map(c => c.key)
}
