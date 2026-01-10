'use client'

import { useTranslations } from 'next-intl'
import { Check, X, Link2, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CampusBadge } from '@/components/CampusBadge'
import type { PendingRegistration, OfflineMember } from './types'

interface RegistrationsTableProps {
  registrations: PendingRegistration[]
  offlineMembers: OfflineMember[]
  isAdmin: boolean
  loading: boolean
  actionLoading: string | null
  onApprove: (registration: PendingRegistration) => void
  onReject: (registration: PendingRegistration) => void
  onLink: (registration: PendingRegistration) => void
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RegistrationsTable({
  registrations,
  offlineMembers,
  isAdmin,
  loading,
  actionLoading,
  onApprove,
  onReject,
  onLink,
}: RegistrationsTableProps) {
  const t = useTranslations('people')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('pending.noRegistrations')}</p>
        <p className="text-sm">{t('pending.noRegistrationsDescription')}</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('pending.name')}</TableHead>
          <TableHead>{t('pending.email')}</TableHead>
          <TableHead>{t('pending.campus')}</TableHead>
          <TableHead>{t('pending.registered')}</TableHead>
          <TableHead className="text-right">{t('pending.actionsColumn')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((registration) => (
          <TableRow key={registration.id}>
            <TableCell className="font-medium">
              {registration.first_name} {registration.last_name}
            </TableCell>
            <TableCell>{registration.email}</TableCell>
            <TableCell>
              {registration.campus ? (
                <CampusBadge
                  name={registration.campus.name}
                  color={registration.campus.color}
                  size="sm"
                />
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t('pending.campusNotSpecified')}
                </span>
              )}
            </TableCell>
            <TableCell>{formatDate(registration.created_at)}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {isAdmin && offlineMembers.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => onLink(registration)}
                    disabled={actionLoading === registration.id}
                    className="!bg-blue-600 hover:!bg-blue-700 !text-white"
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    {t('pending.link')}
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onReject(registration)}
                  disabled={actionLoading === registration.id}
                  className="!bg-red-600 hover:!bg-red-700 !text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('pending.reject')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(registration)}
                  disabled={actionLoading === registration.id}
                  className="!bg-green-600 hover:!bg-green-700 !text-white !border-green-600"
                >
                  {actionLoading === registration.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  {t('pending.approve')}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
