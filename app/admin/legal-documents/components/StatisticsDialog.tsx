'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getDocumentStatistics, getAcceptanceRecords } from '../actions'
import type { LegalDocumentWithStats } from '../actions'

interface StatisticsDialogProps {
  document: LegalDocumentWithStats | null
  onClose: () => void
}

interface Stats {
  acceptedCount: number
  withdrawnCount: number
  totalUsers: number
}

interface AcceptanceRecord {
  id: string
  user_id: string
  action: string
  recorded_at: string
  user_email?: string
  user_name?: string
}

export function StatisticsDialog({ document, onClose }: StatisticsDialogProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [records, setRecords] = useState<AcceptanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!document) {
      setStats(null)
      setRecords([])
      setLoading(true)
      return
    }

    async function loadStats() {
      if (!document) return

      setLoading(true)

      const [statsResult, recordsResult] = await Promise.all([
        getDocumentStatistics(document.id),
        getAcceptanceRecords(document.id, 0, 10),
      ])

      if (statsResult.data) {
        setStats(statsResult.data)
      }
      if (recordsResult.data) {
        setRecords(recordsResult.data)
      }

      setLoading(false)
    }

    loadStats()
  }, [document])

  if (!document) return null

  const acceptanceRate = stats && stats.totalUsers > 0
    ? Math.round((stats.acceptedCount / stats.totalUsers) * 100)
    : 0

  return (
    <Dialog open={!!document} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{document.title}</DialogTitle>
            <Badge variant="secondary">v{document.version}</Badge>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32" />
          </div>
        ) : stats ? (
          <div className="space-y-6 py-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-green-600">
                  {stats.acceptedCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-red-600">
                  {stats.withdrawnCount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Withdrawn</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>

            {/* Acceptance Rate - Simple bar instead of Progress component */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Acceptance Rate</span>
                <span className="font-medium">{acceptanceRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${acceptanceRate}%` }}
                />
              </div>
            </div>

            {/* Recent Acceptances */}
            {records.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Activity</p>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium">{record.user_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.user_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={record.action === 'granted' ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {record.action}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(record.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No statistics available
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
