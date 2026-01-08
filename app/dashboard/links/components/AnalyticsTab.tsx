'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MousePointerClick, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import type { AnalyticsSummary, LinkTreeLinkRow } from '../types'

interface AnalyticsTabProps {
  analytics: AnalyticsSummary | null
  links: LinkTreeLinkRow[]
}

export const AnalyticsTab = memo(function AnalyticsTab({
  analytics,
  links,
}: AnalyticsTabProps) {
  const isMobile = useIsMobile()

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No analytics data yet</h3>
        <p className="text-sm text-muted-foreground">
          Click data will appear here once people start clicking your links
        </p>
      </div>
    )
  }

  // Get link titles for the stats table
  const getLinkTitle = (linkId: string) => {
    const link = links.find(l => l.id === linkId)
    return link?.title || 'Unknown Link'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Clicks"
          value={analytics.total_clicks}
          icon={MousePointerClick}
        />
        <StatCard
          title="Today"
          value={analytics.clicks_today}
          icon={Calendar}
        />
        <StatCard
          title="This Week"
          value={analytics.clicks_this_week}
          icon={TrendingUp}
        />
        <StatCard
          title="This Month"
          value={analytics.clicks_this_month}
          icon={BarChart3}
        />
      </div>

      {/* Per-Link Stats */}
      <div>
        <h3 className="font-semibold mb-3">Clicks by Link</h3>
        {analytics.links_stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No link data available</p>
        ) : isMobile ? (
          /* Mobile - card layout */
          <div className="space-y-2">
            {analytics.links_stats.map((stat) => (
              <div
                key={stat.id}
                className="border border-black dark:border-zinc-700 rounded-lg p-3 space-y-2"
              >
                <div className="font-medium text-sm truncate">
                  {stat.title || getLinkTitle(stat.id)}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">{stat.click_count || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stat.clicks_today || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Today</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stat.clicks_this_week || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Week</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stat.clicks_this_month || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Month</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop - table layout */
          <div className="border border-black dark:border-zinc-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                  <TableHead className="text-right">Week</TableHead>
                  <TableHead className="text-right">Month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.links_stats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">
                      {stat.title || getLinkTitle(stat.id)}
                    </TableCell>
                    <TableCell className="text-right">{stat.click_count || 0}</TableCell>
                    <TableCell className="text-right">{stat.clicks_today || 0}</TableCell>
                    <TableCell className="text-right">{stat.clicks_this_week || 0}</TableCell>
                    <TableCell className="text-right">{stat.clicks_this_month || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
})

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}

const StatCard = memo(function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
})
