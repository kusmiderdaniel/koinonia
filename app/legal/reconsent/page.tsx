'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, AlertTriangle } from 'lucide-react'
import { ConsentCheckbox } from '@/components/legal'
import { getOutdatedConsents, recordReconsentAction } from './actions'

interface OutdatedConsent {
  documentType: string
  currentVersion: number
  acceptedVersion: number | null
}

export default function ReconsentPage() {
  const t = useTranslations('legal.reconsent')
  const tDocs = useTranslations('legal.documents')
  const router = useRouter()

  const [outdatedConsents, setOutdatedConsents] = useState<OutdatedConsent[]>([])
  const [acceptedTypes, setAcceptedTypes] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOutdatedConsents() {
      try {
        const result = await getOutdatedConsents()
        if (result.error) {
          setError(result.error)
        } else if (result.consents) {
          setOutdatedConsents(result.consents)
          // If no consents need updating, redirect to dashboard
          if (result.consents.length === 0) {
            router.push('/dashboard')
          }
        }
      } catch (err) {
        setError('Failed to load consent requirements')
      } finally {
        setIsLoading(false)
      }
    }
    loadOutdatedConsents()
  }, [router])

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'terms_of_service':
        return tDocs('termsOfService')
      case 'privacy_policy':
        return tDocs('privacyPolicy')
      case 'dpa':
        return tDocs('dpa')
      case 'church_admin_terms':
        return tDocs('churchAdminTerms')
      default:
        return type
    }
  }

  const handleConsentChange = (documentType: string, checked: boolean) => {
    setAcceptedTypes((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(documentType)
      } else {
        newSet.delete(documentType)
      }
      return newSet
    })
  }

  const allAccepted = outdatedConsents.every((c) => acceptedTypes.has(c.documentType))

  const handleSubmit = async () => {
    if (!allAccepted) {
      setError(t('mustAcceptAll'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await recordReconsentAction(
        outdatedConsents.map((c) => c.documentType)
      )

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Failed to record consent')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand/5 via-background to-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (outdatedConsents.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand/5 via-background to-background">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 sm:px-6">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Documents Card */}
          <Card className="border-2">
            <CardHeader className="pt-8">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('documentsUpdated')}
              </CardTitle>
              <CardDescription>{t('reviewAndAccept')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Consent Checkboxes */}
              <div className="space-y-3">
                {outdatedConsents.map((consent) => (
                  <div
                    key={consent.documentType}
                    className="px-4 py-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {getDocumentTypeLabel(consent.documentType)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tDocs('version', { version: consent.currentVersion })}
                      </span>
                    </div>
                    <ConsentCheckbox
                      documentType={consent.documentType as 'terms_of_service' | 'privacy_policy' | 'dpa' | 'church_admin_terms'}
                      checked={acceptedTypes.has(consent.documentType)}
                      onCheckedChange={(checked) =>
                        handleConsentChange(consent.documentType, checked)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!allAccepted || isSubmitting}
                className="w-full h-12 text-base !rounded-full !bg-brand hover:!bg-brand/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('accepting')}
                  </>
                ) : (
                  t('acceptAll')
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
