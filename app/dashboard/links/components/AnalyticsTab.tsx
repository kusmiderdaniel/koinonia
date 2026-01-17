'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { MousePointerClick, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import type { AnalyticsSummary, LinkTreeLinkRow } from '../types'

// Chart colors for different links (shared with AnalyticsChart)
const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

// Lazy load the chart component to reduce initial bundle size (~40KB saved)
const AnalyticsChart = dynamic(
  () => import('./AnalyticsChart').then((mod) => ({ default: mod.AnalyticsChart })),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    ),
    ssr: false, // Charts don't need SSR
  }
)

interface AnalyticsTabProps {
  analytics: AnalyticsSummary | null
  links: LinkTreeLinkRow[]
}

export const AnalyticsTab = memo(function AnalyticsTab({
  analytics,
  links,
}: AnalyticsTabProps) {
  const t = useTranslations('links')
  const isMobile = useIsMobile()

  // Prepare chart data with formatted dates
  const chartData = useMemo(() => {
    if (!analytics?.daily_clicks) return []
    return analytics.daily_clicks.map((day) => {
      const date = new Date(day.date)
      return {
        ...day,
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })
  }, [analytics?.daily_clicks])

  // Get link info for chart legend
  const linkInfo = useMemo(() => {
    return links.map((link, index) => ({
      id: link.id,
      title: link.title,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
  }, [links])

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">{t('analytics.empty.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('analytics.empty.description')}
        </p>
      </div>
    )
  }

  // Get link titles for the stats table
  const getLinkTitle = (linkId: string) => {
    const link = links.find((l) => l.id === linkId)
    return link?.title || 'Unknown Link'
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold">{t('analytics.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
      </div>

      {/* Summary Stats */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <h4 className="text-sm font-semibold mb-4">{t('analytics.overview')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title={t('analytics.stats.totalClicks')}
            value={analytics.total_clicks}
            icon={MousePointerClick}
            highlight
          />
          <StatCard
            title={t('analytics.stats.today')}
            value={analytics.clicks_today}
            icon={Calendar}
          />
          <StatCard
            title={t('analytics.stats.thisWeek')}
            value={analytics.clicks_this_week}
            icon={TrendingUp}
          />
          <StatCard
            title={t('analytics.stats.thisMonth')}
            value={analytics.clicks_this_month}
            icon={BarChart3}
          />
        </div>
      </section>

      {/* Chart Section */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <h4 className="text-sm font-semibold mb-4">{t('analytics.clicksOverTime')}</h4>
        {links.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
            {t('analytics.noLinkData')}
          </div>
        ) : (
          <div className="h-[280px]">
            <AnalyticsChart chartData={chartData} linkInfo={linkInfo} />
          </div>
        )}
      </section>

      {/* Per-Link Stats Section */}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
        <h4 className="text-sm font-semibold mb-4">{t('analytics.clicksByLink')}</h4>
        {analytics.links_stats.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
            {t('analytics.noLinkData')}
          </div>
        ) : isMobile ? (
          /* Mobile - card layout */
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {analytics.links_stats.map((stat, index) => (
              <div
                key={stat.id}
                className="bg-muted/30 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="font-medium text-sm truncate">
                    {stat.title || getLinkTitle(stat.id)}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-background rounded-md p-2">
                    <div className="text-lg font-bold">{stat.click_count || 0}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('analytics.table.total')}
                    </div>
                  </div>
                  <div className="bg-background rounded-md p-2">
                    <div className="text-lg font-bold">{stat.clicks_today || 0}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('analytics.stats.today')}
                    </div>
                  </div>
                  <div className="bg-background rounded-md p-2">
                    <div className="text-lg font-bold">{stat.clicks_this_week || 0}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('analytics.stats.week')}
                    </div>
                  </div>
                  <div className="bg-background rounded-md p-2">
                    <div className="text-lg font-bold">{stat.clicks_this_month || 0}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('analytics.stats.month')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop - table layout */
          <div className="max-h-[350px] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">{t('analytics.table.link')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('analytics.table.total')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('analytics.stats.today')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('analytics.stats.week')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('analytics.stats.month')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.links_stats.map((stat, index) => (
                  <TableRow key={stat.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="font-medium truncate max-w-[180px]">
                          {stat.title || getLinkTitle(stat.id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {stat.click_count || 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{stat.clicks_today || 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{stat.clicks_this_week || 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{stat.clicks_this_month || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
})

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}

const StatCard = memo(function StatCard({ title, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card
      tabIndex={-1}
      style={{ outline: 'none' }}
      className={`border p-4 py-5 flex flex-col justify-between min-h-[100px] !outline-none !ring-0 focus:!outline-none focus:!ring-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 ${highlight ? 'border-brand bg-brand/5' : 'border-zinc-200 dark:border-zinc-700'}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${highlight ? 'text-brand' : 'text-muted-foreground'}`}>{title}</span>
        <Icon className={`h-4 w-4 ${highlight ? 'text-brand' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex justify-end">
        <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      </div>
    </Card>
  )
})
