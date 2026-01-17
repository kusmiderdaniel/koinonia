'use client'

import { useTranslations } from 'next-intl'
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
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('yourConsents')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('yourConsentsDescription')}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeConsents.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noConsents')}</p>
      ) : (
        <div className="space-y-2">
          {activeConsents.map((consent) => (
            <div
              key={consent.id}
              className="flex items-center justify-between p-3 rounded-lg border border-black/20 dark:border-white/20"
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
    </div>
  )
}
