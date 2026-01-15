'use client'

import { useState, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { getConsentHistory } from '@/lib/legal/actions'
import { getDataExportStatus, getAccountDeletionStatus } from '../actions'
import {
  ActiveConsentsCard,
  ConsentHistoryCard,
  DataExportCard,
  AccountDeletionCard,
  type ConsentRecord,
  type DataExportStatus,
  type DeletionStatus,
} from './privacy'

export function PrivacySettingsCard() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [isLoadingConsents, setIsLoadingConsents] = useState(true)
  const [exportStatus, setExportStatus] = useState<DataExportStatus>({ status: 'none' })
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({ status: 'none' })

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

  return (
    <div className="space-y-6">
      <ActiveConsentsCard consents={consents} isLoading={isLoadingConsents} />

      <ConsentHistoryCard consents={consents} />

      <Separator />

      <DataExportCard initialStatus={exportStatus} />

      <Separator />

      <AccountDeletionCard initialStatus={deletionStatus} />
    </div>
  )
}
