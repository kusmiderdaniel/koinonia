'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, MousePointer, Send, Percent, Loader2, Calendar, ArrowRight } from 'lucide-react'
import { StatCard, LineChart, PieChart, BarChart, StackedBarChart, GroupedStackedBarChart } from '@/components/charts'
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
  getFieldTimeSeries,
  getGroupedStackedTimeSeries,
  type FormAnalytics,
  type FieldSummary,
  type ChartableField,
  type DateField,
  type TimeSeriesData,
  type GroupByOption,
  type AggregationMethod,
  type SplitByField,
  type GroupedStackedData,
} from '@/app/dashboard/forms/actions'

interface AnalyticsDashboardProps {
  formId: string
}

function formatDateDDMMYYYY(dateString: string): string {
  const date = new Date(dateString)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function AnalyticsDashboard({ formId }: AnalyticsDashboardProps) {
  const t = useTranslations('forms')
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null)
  const [fieldSummaries, setFieldSummaries] = useState<FieldSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState('30')

  // New state for interactive chart
  const [dateFields, setDateFields] = useState<DateField[]>([])
  const [chartableFields, setChartableFields] = useState<ChartableField[]>([])
  const [splitByFields, setSplitByFields] = useState<SplitByField[]>([])
  const [selectedDateField, setSelectedDateField] = useState<string>('')
  const [selectedValueField, setSelectedValueField] = useState<string>('')
  const [selectedSplitByField, setSelectedSplitByField] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupByOption>('date')
  const [aggregation, setAggregation] = useState<AggregationMethod>('sum')
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null)
  const [groupedStackedData, setGroupedStackedData] = useState<GroupedStackedData | null>(null)
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false)

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
        // Auto-select first options if available
        if (fieldsResult.dateFields.length > 0 && !selectedDateField) {
          setSelectedDateField(fieldsResult.dateFields[0].id)
        }
        if (fieldsResult.chartableFields.length > 0 && !selectedValueField) {
          setSelectedValueField(fieldsResult.chartableFields[0].id)
        }
      }

      setLoading(false)
    }

    loadAnalytics()
  }, [formId, days])

  // Load time series data when selections change
  const loadTimeSeries = useCallback(async () => {
    if (!selectedDateField || !selectedValueField) {
      setTimeSeriesData(null)
      setGroupedStackedData(null)
      return
    }

    setTimeSeriesLoading(true)

    // Check if selected field is a select type
    const field = chartableFields.find(f => f.id === selectedValueField)
    const isSelectField = field?.type === 'single_select' || field?.type === 'multi_select'

    if (isSelectField) {
      // For select fields, get grouped stacked data (number fields grouped by select options)
      const result = await getGroupedStackedTimeSeries(
        formId,
        selectedDateField,
        selectedValueField,
        groupBy,
        aggregation
      )
      if (result.data) {
        setGroupedStackedData(result.data)
        setTimeSeriesData(null)
      } else {
        // Fallback to regular time series if no number fields
        const fallbackResult = await getFieldTimeSeries(
          formId,
          selectedDateField,
          selectedValueField,
          groupBy,
          aggregation
        )
        if (fallbackResult.data) {
          setTimeSeriesData(fallbackResult.data)
          setGroupedStackedData(null)
        }
      }
    } else {
      // For number fields, use regular time series
      const result = await getFieldTimeSeries(
        formId,
        selectedDateField,
        selectedValueField,
        groupBy,
        aggregation,
        selectedSplitByField || undefined
      )
      if (result.data) {
        setTimeSeriesData(result.data)
        setGroupedStackedData(null)
      }
    }
    setTimeSeriesLoading(false)
  }, [formId, selectedDateField, selectedValueField, groupBy, aggregation, selectedSplitByField, chartableFields])

  useEffect(() => {
    loadTimeSeries()
  }, [loadTimeSeries])

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

  // Get selected field info for chart
  const selectedField = chartableFields.find((f) => f.id === selectedValueField)

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-y-auto h-full">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px] border border-black dark:border-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black dark:border-white">
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
          <Card className="border border-black dark:border-white">
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
          <Card className="border border-black dark:border-white">
            <CardContent className="pt-4">
              <PieChart data={deviceData} tooltipLabel={t('analytics.responses')} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Response Chart */}
      {dateFields.length > 0 && chartableFields.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-medium">{t('analytics.responsesOverTime')}</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('analytics.showField')}:</span>
              <Select value={selectedValueField} onValueChange={setSelectedValueField}>
                <SelectTrigger className="w-[200px] border border-black dark:border-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-black dark:border-white">
                  {chartableFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {dateFields.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('analytics.dateField')}:</span>
                <Select value={selectedDateField} onValueChange={setSelectedDateField}>
                  <SelectTrigger className="w-[200px] border border-black dark:border-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-black dark:border-white">
                    {dateFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('analytics.groupBy')}:</span>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                <SelectTrigger className="w-[130px] border border-black dark:border-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-black dark:border-white">
                  <SelectItem value="date">{t('analytics.perDate')}</SelectItem>
                  <SelectItem value="week">{t('analytics.perWeek')}</SelectItem>
                  <SelectItem value="month">{t('analytics.perMonth')}</SelectItem>
                  <SelectItem value="year">{t('analytics.perYear')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedField?.type === 'number' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('analytics.aggregation')}:</span>
                  <Select value={aggregation} onValueChange={(v) => setAggregation(v as AggregationMethod)}>
                    <SelectTrigger className="w-[130px] border border-black dark:border-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border border-black dark:border-white">
                      <SelectItem value="sum">{t('analytics.sum')}</SelectItem>
                      <SelectItem value="average">{t('analytics.avg')}</SelectItem>
                      <SelectItem value="median">{t('analytics.median')}</SelectItem>
                      <SelectItem value="min">{t('analytics.min')}</SelectItem>
                      <SelectItem value="max">{t('analytics.max')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {splitByFields.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('analytics.splitBy')}:</span>
                    <Select value={selectedSplitByField || 'none'} onValueChange={(v) => setSelectedSplitByField(v === 'none' ? '' : v)}>
                      <SelectTrigger className="w-[180px] border border-black dark:border-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-black dark:border-white">
                        <SelectItem value="none">{t('analytics.none')}</SelectItem>
                        {splitByFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
          <Card className="border border-black dark:border-white">
            <CardContent className="pt-4">
              {timeSeriesLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : groupedStackedData && groupedStackedData.data.length > 0 ? (
                // Grouped stacked bar chart for select fields with number fields
                <GroupedStackedBarChart
                  data={groupedStackedData.data}
                  xAxisKey="date"
                  selectOptions={groupedStackedData.selectOptions}
                  numberFields={groupedStackedData.numberFields}
                />
              ) : timeSeriesData && timeSeriesData.data.length > 0 ? (
                selectedField?.type === 'number' ? (
                  timeSeriesData.splitByOptions ? (
                    <LineChart
                      data={timeSeriesData.data}
                      xAxisKey="date"
                      lines={timeSeriesData.splitByOptions.map((opt: { value: string; label: string; color: string }) => ({
                        dataKey: opt.value,
                        name: opt.label,
                        color: opt.color,
                      }))}
                    />
                  ) : (
                    <LineChart
                      data={timeSeriesData.data}
                      xAxisKey="date"
                      lines={[
                        { dataKey: 'value', color: '#f49f1e', name: selectedField.label },
                      ]}
                    />
                  )
                ) : (
                  // Fallback: stacked bar chart showing response counts per select option
                  <StackedBarChart
                    data={timeSeriesData.data}
                    xAxisKey="date"
                    bars={
                      timeSeriesData.options?.map((opt: { value: string; label: string; color: string }) => ({
                        dataKey: opt.value,
                        name: opt.label,
                        color: opt.color,
                      })) || []
                    }
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('analytics.noDataForSelection')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Field Summaries */}
      {fieldSummaries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('analytics.responseSummary')}</h3>
          {fieldSummaries.map((summary) => (
            <FieldSummaryCard key={summary.fieldId} summary={summary} />
          ))}
        </div>
      )}
    </div>
  )
}

function FieldSummaryCard({ summary }: { summary: FieldSummary }) {
  const t = useTranslations('forms')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{summary.fieldLabel}</h4>
        <span className="text-xs text-muted-foreground">
          {summary.responseCount} {t('analytics.responses')}
        </span>
      </div>
      <Card className="border border-black dark:border-white">
        <CardContent className="pt-4">
        {summary.data.type === 'select' && (
          <BarChart
            data={summary.data.options.map((opt) => ({
              name: opt.label,
              value: opt.count,
            }))}
            colors={summary.data.options.map((opt) => opt.color)}
            horizontal
            className="min-h-[100px]"
            tooltipLabel={t('analytics.responses')}
          />
        )}

        {summary.data.type === 'checkbox' && (
          <PieChart
            data={[
              { name: t('analytics.yes'), value: summary.data.trueCount },
              { name: t('analytics.no'), value: summary.data.falseCount },
            ]}
            colors={['#10b981', '#ef4444']}
            className="max-h-[200px]"
            tooltipLabel={t('analytics.responses')}
          />
        )}

        {summary.data.type === 'number' && (
          <div className="grid grid-cols-4 gap-4 text-center pb-4">
            <div>
              <p className="text-2xl font-bold">{summary.data.min}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.min')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.data.max}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.max')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.data.avg}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.average')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.data.median}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.median')}</p>
            </div>
          </div>
        )}

        {summary.data.type === 'date' && (
          <div className="flex items-center justify-center gap-4 min-h-[100px]">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{t('analytics.from')}</span>
              </div>
              <p className="text-xl font-semibold">
                {summary.data.min ? formatDateDDMMYYYY(summary.data.min) : '-'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{t('analytics.to')}</span>
              </div>
              <p className="text-xl font-semibold">
                {summary.data.max ? formatDateDDMMYYYY(summary.data.max) : '-'}
              </p>
            </div>
          </div>
        )}

        {summary.data.type === 'text' && (
          <p className="text-muted-foreground text-sm">
            {summary.data.count} {t('analytics.textResponses')}
          </p>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
