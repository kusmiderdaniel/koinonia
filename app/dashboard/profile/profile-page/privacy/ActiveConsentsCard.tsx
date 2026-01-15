'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, FileText, Check, Loader2 } from 'lucide-react'
import type { ConsentRecord } from './types'

interface ActiveConsentsCardProps {
  consents: ConsentRecord[]
  isLoading: boolean
}

export function ActiveConsentsCard({ consents, isLoading }: ActiveConsentsCardProps) {
  const t = useTranslations('legal.privacy')
  const tDocs = useTranslations('legal.documents')

  // Get active consents (most recent granted per type)
  const activeConsents = consents.reduce((acc, consent) => {
    if (consent.action === 'granted') {
      const existing = acc.find(c => c.consent_type === consent.consent_type)
      if (!existing || new Date(consent.recorded_at) > new Date(existing.recorded_at)) {
        return [...acc.filter(c => c.consent_type !== consent.consent_type), consent]
      }
    }
    return acc
  }, [] as ConsentRecord[])

  const getConsentTypeLabel = (type: string) => {
    switch (type) {
      case 'terms_of_service':
        return tDocs('termsOfService')
      case 'privacy_policy':
        return tDocs('privacyPolicy')
      case 'dpa':
        return tDocs('dpa')
      case 'church_admin_terms':
        return tDocs('churchAdminTerms')
      case 'data_sharing':
        return t('dataSharing') || 'Data Sharing'
      default:
        return type
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('yourConsents')}</CardTitle>
        </div>
        <CardDescription>{t('yourConsentsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeConsents.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noConsents')}</p>
        ) : (
          <div className="space-y-3">
            {activeConsents.map((consent) => (
              <div
                key={consent.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {getConsentTypeLabel(consent.consent_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('consentedOn', { date: formatDate(consent.recorded_at) })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  {t('status.active')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
