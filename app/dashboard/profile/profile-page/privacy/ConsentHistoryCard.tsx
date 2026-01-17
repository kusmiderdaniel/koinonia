'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import type { ConsentRecord } from './types'

interface ConsentHistoryCardProps {
  consents: ConsentRecord[]
}

export function ConsentHistoryCard({ consents }: ConsentHistoryCardProps) {
  const t = useTranslations('legal.privacy')
  const tDocs = useTranslations('legal.documents')
  const [showHistory, setShowHistory] = useState(false)

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

  if (consents.length === 0) {
    return null
  }

  return (
    <Collapsible open={showHistory} onOpenChange={setShowHistory}>
      <CollapsibleTrigger asChild>
        <button className="w-full p-3 rounded-lg border border-black/20 dark:border-white/20 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t('consentHistory')}</p>
                <p className="text-xs text-muted-foreground">{t('consentHistoryDescription')}</p>
              </div>
            </div>
            {showHistory ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="flex items-center justify-between p-2 text-sm border-b border-black/20 dark:border-white/20 last:border-0"
            >
              <div>
                <span className="font-medium">
                  {getConsentTypeLabel(consent.consent_type)}
                </span>
                {consent.document_version && (
                  <span className="text-muted-foreground ml-2">
                    v{consent.document_version}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant={consent.action === 'granted' ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {consent.action === 'granted' ? t('status.active') : t('status.withdrawn')}
                </Badge>
                <span className="text-muted-foreground">
                  {formatDate(consent.recorded_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
