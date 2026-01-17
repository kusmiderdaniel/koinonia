'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  FileText,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  Building,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { getOutdatedConsents, recordSingleConsent } from './actions'
import { format } from 'date-fns'

interface OutdatedConsent {
  documentId: string
  documentType: string
  documentTitle: string
  currentVersion: number
  acceptedVersion: number | null
  summary: string | null
  content: string
  effectiveDate: string
  isChurchDocument: boolean
}

const translations = {
  en: {
    title: 'Review Updated Documents',
    description: 'Our legal documents have been updated. Please review and accept the changes to continue using Koinonia.',
    loading: 'Loading...',
    noDocuments: 'No documents need review.',
    version: 'Version',
    effectiveDate: 'Effective',
    summaryOfChanges: 'Summary of Changes',
    viewDocument: 'View Full Document',
    hideDocument: 'Hide Document',
    acceptDocument: 'I Accept',
    disagreeDocument: 'I Disagree',
    accepted: 'Accepted',
    accepting: 'Accepting...',
    continueToApp: 'Continue to Dashboard',
    allAccepted: 'All documents accepted!',
    allAcceptedDescription: 'Thank you for reviewing and accepting the updated documents.',
    errorLoading: 'Failed to load consent requirements',
    errorAccepting: 'Failed to record consent',
    previouslyAccepted: 'Previously accepted version',
    churchOwnerDocument: 'Church Owner',
    churchDocumentWarning: 'Disagreeing with this document will result in deletion of your church and all its data.',
    userDocumentWarning: 'Disagreeing with this document will result in deletion of your account.',
  },
  pl: {
    title: 'Przejrzyj zaktualizowane dokumenty',
    description: 'Nasze dokumenty prawne zostały zaktualizowane. Przejrzyj i zaakceptuj zmiany, aby kontynuować korzystanie z Koinonia.',
    loading: 'Ładowanie...',
    noDocuments: 'Brak dokumentów do przeglądu.',
    version: 'Wersja',
    effectiveDate: 'Obowiązuje od',
    summaryOfChanges: 'Podsumowanie zmian',
    viewDocument: 'Zobacz pełny dokument',
    hideDocument: 'Ukryj dokument',
    acceptDocument: 'Akceptuję',
    disagreeDocument: 'Nie zgadzam się',
    accepted: 'Zaakceptowano',
    accepting: 'Akceptowanie...',
    continueToApp: 'Przejdź do panelu',
    allAccepted: 'Wszystkie dokumenty zaakceptowane!',
    allAcceptedDescription: 'Dziękujemy za przejrzenie i zaakceptowanie zaktualizowanych dokumentów.',
    errorLoading: 'Nie udało się załadować wymagań zgody',
    errorAccepting: 'Nie udało się zapisać zgody',
    previouslyAccepted: 'Poprzednio zaakceptowana wersja',
    churchOwnerDocument: 'Właściciel kościoła',
    churchDocumentWarning: 'Niezgodzenie się na ten dokument spowoduje usunięcie Twojego kościoła i wszystkich jego danych.',
    userDocumentWarning: 'Niezgodzenie się na ten dokument spowoduje usunięcie Twojego konta.',
  },
}

export default function ReconsentPage() {
  const router = useRouter()

  const [outdatedConsents, setOutdatedConsents] = useState<OutdatedConsent[]>([])
  const [acceptedDocIds, setAcceptedDocIds] = useState<Set<string>>(new Set())
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [acceptingDocId, setAcceptingDocId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'pl'>('en')

  const t = translations[language]

  useEffect(() => {
    // Detect language from cookie or browser
    const detectLanguage = () => {
      const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
      if (cookieMatch) {
        return cookieMatch[1] === 'pl' ? 'pl' : 'en'
      }
      return navigator.language.startsWith('pl') ? 'pl' : 'en'
    }
    setLanguage(detectLanguage())
  }, [])

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
          } else {
            // Auto-expand first document
            setExpandedDocId(result.consents[0].documentId)
          }
        }
      } catch {
        setError(t.errorLoading)
      } finally {
        setIsLoading(false)
      }
    }
    loadOutdatedConsents()
  }, [router, t.errorLoading])

  const handleAccept = async (documentId: string) => {
    setAcceptingDocId(documentId)
    setError(null)

    try {
      const result = await recordSingleConsent(documentId)

      if (result.error) {
        setError(result.error)
      } else {
        setAcceptedDocIds((prev) => new Set([...prev, documentId]))

        // Find next unaccepted document and expand it
        const remainingDocs = outdatedConsents.filter(
          (c) => c.documentId !== documentId && !acceptedDocIds.has(c.documentId)
        )
        if (remainingDocs.length > 0) {
          setExpandedDocId(remainingDocs[0].documentId)
        } else {
          setExpandedDocId(null)
        }
      }
    } catch {
      setError(t.errorAccepting)
    } finally {
      setAcceptingDocId(null)
    }
  }

  const allAccepted = outdatedConsents.length > 0 &&
    outdatedConsents.every((c) => acceptedDocIds.has(c.documentId))

  const toggleExpand = (docId: string) => {
    setExpandedDocId((prev) => (prev === docId ? null : docId))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand/5 via-background to-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <span className="text-muted-foreground">{t.loading}</span>
        </div>
      </div>
    )
  }

  if (outdatedConsents.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand/5 via-background to-background">
      <div className="flex flex-col items-center min-h-screen px-4 py-8 sm:px-6">
        <div className="w-full max-w-3xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-4 pt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t.description}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* All Accepted State */}
          {allAccepted && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                      {t.allAccepted}
                    </h2>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      {t.allAcceptedDescription}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="mt-2 !bg-brand hover:!bg-brand/90 !text-brand-foreground"
                  >
                    {t.continueToApp}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List */}
          {!allAccepted && (
            <div className="space-y-4">
              {outdatedConsents.map((consent) => {
                const isAccepted = acceptedDocIds.has(consent.documentId)
                const isExpanded = expandedDocId === consent.documentId
                const isAccepting = acceptingDocId === consent.documentId

                return (
                  <Card
                    key={consent.documentId}
                    className={`transition-all ${
                      isAccepted
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                        : 'border-2'
                    }`}
                  >
                    <CardHeader className="pt-6 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {consent.isChurchDocument ? (
                                <Building className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                              {consent.documentTitle}
                            </CardTitle>
                            {consent.isChurchDocument && !isAccepted && (
                              <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                                <Building className="h-3 w-3 mr-1" />
                                {t.churchOwnerDocument}
                              </Badge>
                            )}
                            {isAccepted && (
                              <Badge className="bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                {t.accepted}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              {t.version} {consent.currentVersion}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t.effectiveDate}: {format(new Date(consent.effectiveDate), 'MMM d, yyyy')}
                            </span>
                            {consent.acceptedVersion && (
                              <span className="text-xs text-muted-foreground">
                                ({t.previouslyAccepted}: v{consent.acceptedVersion})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Summary */}
                      {consent.summary && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase mb-1">
                            {t.summaryOfChanges}
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-100">
                            {consent.summary}
                          </p>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0 pb-6">
                      {/* Expand/Collapse Button */}
                      {!isAccepted && (
                        <Button
                          variant="ghost"
                          className="w-full justify-between mb-3"
                          onClick={() => toggleExpand(consent.documentId)}
                        >
                          <span>{isExpanded ? t.hideDocument : t.viewDocument}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}

                      {/* Document Content */}
                      {isExpanded && !isAccepted && (
                        <div className="mb-4">
                          <ScrollArea className="h-[400px] border rounded-lg bg-muted/30 p-4">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0">{children}</h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-lg font-semibold mt-6 mb-3 border-b pb-2">{children}</h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="text-sm leading-relaxed mb-3 text-muted-foreground">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-outside ml-6 mb-4 space-y-1">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-outside ml-6 mb-4 space-y-1">{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-foreground">{children}</strong>
                                  ),
                                }}
                              >
                                {consent.content}
                              </ReactMarkdown>
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!isAccepted && (
                        <>
                          <Separator className="my-4" />

                          {/* Warning about disagreement consequences */}
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              {consent.isChurchDocument ? t.churchDocumentWarning : t.userDocumentWarning}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={() => handleAccept(consent.documentId)}
                              disabled={isAccepting}
                              className="flex-1 h-11 !bg-brand hover:!bg-brand/90 !text-brand-foreground"
                            >
                              {isAccepting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t.accepting}
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  {t.acceptDocument}
                                </>
                              )}
                            </Button>
                            <Link
                              href={`/legal/disagree/${consent.isChurchDocument ? 'church' : 'user'}?doc=${consent.documentType}&id=${consent.documentId}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                className="w-full h-11 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                                disabled={isAccepting}
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t.disagreeDocument}
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
