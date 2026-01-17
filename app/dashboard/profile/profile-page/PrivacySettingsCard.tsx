'use client'

import { useState, useEffect } from 'react'
import { getConsentHistory } from '@/lib/legal/actions'
import { getAccountDeletionStatus } from '../actions'
import {
  ActiveConsentsCard,
  ConsentHistoryCard,
  AccountDeletionCard,
  type ConsentRecord,
  type DeletionStatus,
} from './privacy'

export function PrivacySettingsCard() {
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [isLoadingConsents, setIsLoadingConsents] = useState(true)
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

      <div className="border-t border-black/20 dark:border-white/20" />

      <AccountDeletionCard initialStatus={deletionStatus} />
    </div>
  )
}
