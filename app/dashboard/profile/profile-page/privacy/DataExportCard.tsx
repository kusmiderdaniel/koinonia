'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Check, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { requestDataExport } from '../../actions'
import type { DataExportStatus } from './types'

interface DataExportCardProps {
  initialStatus: DataExportStatus
}

export function DataExportCard({ initialStatus }: DataExportCardProps) {
  const t = useTranslations('legal.privacy')

  const [exportStatus, setExportStatus] = useState<DataExportStatus>(initialStatus)
  const [isRequestingExport, setIsRequestingExport] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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

  return (
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
  )
}
