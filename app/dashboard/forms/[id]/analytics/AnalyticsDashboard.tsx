'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, MousePointer, Send, Percent, Loader2 } from 'lucide-react'
import { StatCard, LineChart, PieChart } from '@/components/charts'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getFormAnalytics,
  getFieldSummaries,
  getChartableFields,
  type FormAnalytics,
  type FieldSummary,
  type ChartableField,
  type DateField,
  type SplitByField,
} from '@/app/dashboard/forms/actions'
import { FieldSummaryCard } from './FieldSummaryCard'
import { InteractiveChart } from './InteractiveChart'

interface AnalyticsDashboardProps {
  formId: string
}

export function AnalyticsDashboard({ formId }: AnalyticsDashboardProps) {
  const t = useTranslations('forms')
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null)
  const [fieldSummaries, setFieldSummaries] = useState<FieldSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState('30')

  // Chart fields state (loaded once, passed to InteractiveChart)
  const [dateFields, setDateFields] = useState<DateField[]>([])
  const [chartableFields, setChartableFields] = useState<ChartableField[]>([])
  const [splitByFields, setSplitByFields] = useState<SplitByField[]>([])

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      setError(null)

      const [analyticsResult, summariesResult, fieldsResult] = await Promise.all([
        getFormAnalytics(formId, days === 'all' ? undefined : parseInt(days)),
        getFieldSummaries(formId),
        getChartableFields(formId),
      ])

      if (analyticsResult.error) {
        setError(analyticsResult.error)
      } else if (analyticsResult.data) {
        setAnalytics(analyticsResult.data)
      }

      if (summariesResult.data) {
        setFieldSummaries(summariesResult.data)
      }

      if (fieldsResult.dateFields && fieldsResult.chartableFields) {
        setDateFields(fieldsResult.dateFields)
        setChartableFields(fieldsResult.chartableFields)
        setSplitByFields(fieldsResult.splitByFields || [])
      }

      setLoading(false)
    }

    loadAnalytics()
  }, [formId, days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const deviceData = [
    { name: t('analytics.desktop'), value: analytics.deviceBreakdown.desktop },
    { name: t('analytics.mobile'), value: analytics.deviceBreakdown.mobile },
    { name: t('analytics.tablet'), value: analytics.deviceBreakdown.tablet },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px] border border-black/20 dark:border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black/20 dark:border-white/20">
            <SelectItem value="all">{t('analytics.allTime')}</SelectItem>
            <SelectItem value="7">{t('analytics.last7Days')}</SelectItem>
            <SelectItem value="30">{t('analytics.last30Days')}</SelectItem>
            <SelectItem value="90">{t('analytics.last90Days')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={t('analytics.views')}
          value={analytics.totals.views}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard
          label={t('analytics.starts')}
          value={analytics.totals.starts}
          icon={<MousePointer className="h-5 w-5" />}
        />
        <StatCard
          label={t('analytics.submissions')}
          value={analytics.totals.submissions}
          icon={<Send className="h-5 w-5" />}
        />
        <StatCard
          label={t('analytics.completionRate')}
          value={`${analytics.totals.completionRate}%`}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      {/* Timeline Chart */}
      {analytics.timeline.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-medium">{t('analytics.activityOverTime')}</h3>
          <Card className="border border-black/20 dark:border-white/20">
            <CardContent className="pt-4">
              <LineChart
                data={analytics.timeline}
                xAxisKey="date"
                lines={[
                  { dataKey: 'views', color: '#94a3b8', name: t('analytics.views') },
                  { dataKey: 'starts', color: '#3b82f6', name: t('analytics.starts') },
                  { dataKey: 'submissions', color: '#f49f1e', name: t('analytics.submissions') },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device Breakdown */}
      {(analytics.deviceBreakdown.desktop > 0 ||
        analytics.deviceBreakdown.mobile > 0 ||
        analytics.deviceBreakdown.tablet > 0) && (
        <div className="space-y-2">
          <h3 className="text-base font-medium">{t('analytics.deviceBreakdown')}</h3>
          <Card className="border border-black/20 dark:border-white/20">
            <CardContent className="pt-4">
              <PieChart data={deviceData} tooltipLabel={t('analytics.responses')} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Response Chart */}
      <InteractiveChart
        formId={formId}
        dateFields={dateFields}
        chartableFields={chartableFields}
        splitByFields={splitByFields}
      />

      {/* Field Summaries */}
      {fieldSummaries.length > 0 && (() => {
        // Filter out field types that don't have meaningful summaries
        const excludedTypes = ['text', 'textarea', 'divider', 'email']
        const filteredSummaries = fieldSummaries.filter(
          (summary) => !excludedTypes.includes(summary.fieldType)
        )

        if (filteredSummaries.length === 0) return null

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('analytics.responseSummary')}</h3>
            {filteredSummaries.map((summary) => (
              <FieldSummaryCard key={summary.fieldId} summary={summary} />
            ))}
          </div>
        )
      })()}
    </div>
  )
}
