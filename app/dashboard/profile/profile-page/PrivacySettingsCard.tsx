'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  FileText,
  Check,
  Clock,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react'
import { getConsentHistory } from '@/lib/legal/actions'
import {
  requestDataExport,
  getDataExportStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionStatus,
} from '../actions'

interface ConsentRecord {
  id: string
  consent_type: string
  action: 'granted' | 'withdrawn'
  recorded_at: string
  document_version?: number
  data_categories_shared?: string[]
}

interface DataExportStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  downloadUrl?: string
  expiresAt?: string
}

interface DeletionStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'cancelled'
  scheduledAt?: string
}

export function PrivacySettingsCard() {
  const t = useTranslations('legal.privacy')
  const tDocs = useTranslations('legal.documents')

  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [isLoadingConsents, setIsLoadingConsents] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const [exportStatus, setExportStatus] = useState<DataExportStatus>({ status: 'none' })
  const [isRequestingExport, setIsRequestingExport] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({ status: 'none' })
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false)
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionError, setDeletionError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load consent history on mount
  useEffect(() => {
    async function loadConsents() {
      try {
        const result = await getConsentHistory()
        if (result.consents) {
          setConsents(result.consents)
        }
      } catch (error) {
        console.error('Failed to load consents:', error)
      } finally {
        setIsLoadingConsents(false)
      }
    }
    loadConsents()
  }, [])

  // Load export status on mount
  useEffect(() => {
    async function loadExportStatus() {
      try {
        const result = await getDataExportStatus()
        if (result.status) {
          setExportStatus(result.status)
        }
      } catch (error) {
        console.error('Failed to load export status:', error)
      }
    }
    loadExportStatus()
  }, [])

  // Load deletion status on mount
  useEffect(() => {
    async function loadDeletionStatus() {
      try {
        const result = await getAccountDeletionStatus()
        if (result.status) {
          setDeletionStatus(result.status)
        }
      } catch (error) {
        console.error('Failed to load deletion status:', error)
      }
    }
    loadDeletionStatus()
  }, [])

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

  const handleRequestExport = async () => {
    setIsRequestingExport(true)
    setExportError(null)

    try {
      const result = await requestDataExport()
      if (result.error) {
        setExportError(result.error)
      } else {
        setExportStatus({ status: 'pending' })
      }
    } catch (error) {
      setExportError(t('dataExport.failedDescription'))
    } finally {
      setIsRequestingExport(false)
    }
  }

  const handleRequestDeletion = async () => {
    setIsRequestingDeletion(true)
    setDeletionError(null)

    try {
      const result = await requestAccountDeletion(deletionReason || undefined)
      if (result.error) {
        setDeletionError(result.error)
      } else {
        setDeletionStatus({
          status: 'pending',
          scheduledAt: result.scheduledAt,
        })
        setShowDeleteDialog(false)
      }
    } catch (error) {
      setDeletionError(t('deleteAccount.dialogDescription'))
    } finally {
      setIsRequestingDeletion(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsCancellingDeletion(true)

    try {
      const result = await cancelAccountDeletion()
      if (!result.error) {
        setDeletionStatus({ status: 'none' })
      }
    } catch (error) {
      console.error('Failed to cancel deletion:', error)
    } finally {
      setIsCancellingDeletion(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Consents */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('yourConsents')}</CardTitle>
          </div>
          <CardDescription>{t('yourConsentsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConsents ? (
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

      {/* Consent History */}
      {consents.length > 0 && (
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{t('consentHistory')}</CardTitle>
                    <CardDescription>{t('consentHistoryDescription')}</CardDescription>
                  </div>
                  {showHistory ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-2">
                  {consents.map((consent) => (
                    <div
                      key={consent.id}
                      className="flex items-center justify-between p-2 text-sm border-b last:border-0"
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
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Separator />

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('dataExport.title')}</CardTitle>
          </div>
          <CardDescription>{t('dataExport.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {exportError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}

          {exportStatus.status === 'none' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">{t('dataExport.contents')}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('dataExport.contentsProfile')}</li>
                  <li>{t('dataExport.contentsMinistries')}</li>
                  <li>{t('dataExport.contentsEvents')}</li>
                  <li>{t('dataExport.contentsForms')}</li>
                  <li>{t('dataExport.contentsConsents')}</li>
                </ul>
              </div>
              <Button
                onClick={handleRequestExport}
                disabled={isRequestingExport}
              >
                {isRequestingExport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dataExport.requesting')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('dataExport.button')}
                  </>
                )}
              </Button>
            </div>
          )}

          {(exportStatus.status === 'pending' || exportStatus.status === 'processing') && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
              <div>
                <p className="font-medium">{t('dataExport.pending')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dataExport.pendingDescription')}
                </p>
              </div>
            </div>
          )}

          {exportStatus.status === 'completed' && exportStatus.downloadUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {t('dataExport.ready')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t('dataExport.readyDescription')}
                  </p>
                  {exportStatus.expiresAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {t('dataExport.expiresOn', { date: formatDate(exportStatus.expiresAt) })}
                    </p>
                  )}
                </div>
              </div>
              <Button asChild>
                <a href={exportStatus.downloadUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  {t('dataExport.downloadButton')}
                </a>
              </Button>
            </div>
          )}

          {exportStatus.status === 'expired' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('dataExport.expired')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('dataExport.expiredDescription')}
                  </p>
                </div>
              </div>
              <Button onClick={handleRequestExport} disabled={isRequestingExport}>
                {isRequestingExport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dataExport.requesting')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('dataExport.button')}
                  </>
                )}
              </Button>
            </div>
          )}

          {exportStatus.status === 'failed' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">{t('dataExport.failed')}</p>
                  <p className="text-sm">{t('dataExport.failedDescription')}</p>
                </AlertDescription>
              </Alert>
              <Button onClick={handleRequestExport} disabled={isRequestingExport}>
                {isRequestingExport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dataExport.requesting')}
                  </>
                ) : (
                  t('dataExport.retryButton')
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Account Deletion */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">{t('deleteAccount.title')}</CardTitle>
          </div>
          <CardDescription>{t('deleteAccount.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {deletionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{deletionError}</AlertDescription>
            </Alert>
          )}

          {deletionStatus.status === 'none' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">{t('deleteAccount.warning')}</p>
                  <p className="text-sm mt-1">{t('deleteAccount.warningDescription')}</p>
                </AlertDescription>
              </Alert>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('deleteAccount.button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteAccount.dialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteAccount.dialogDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="deletion-reason">{t('deleteAccount.reasonLabel')}</Label>
                      <Textarea
                        id="deletion-reason"
                        placeholder={t('deleteAccount.reasonPlaceholder')}
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('deleteAccount.gracePeriod')}
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('deleteAccount.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRequestDeletion}
                      disabled={isRequestingDeletion}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isRequestingDeletion ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('deleteAccount.deleting')}
                        </>
                      ) : (
                        t('deleteAccount.confirmButton')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {deletionStatus.status === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <Clock className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {t('deleteAccount.pendingTitle')}
                  </p>
                  {deletionStatus.scheduledAt && (
                    <p className="text-sm text-destructive/80">
                      {t('deleteAccount.pendingDescription', {
                        date: formatDate(deletionStatus.scheduledAt),
                      })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelDeletion}
                disabled={isCancellingDeletion}
              >
                {isCancellingDeletion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('deleteAccount.cancelling')}
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('deleteAccount.cancelDeletion')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
