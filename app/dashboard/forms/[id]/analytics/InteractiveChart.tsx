'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { LineChart, StackedBarChart, GroupedStackedBarChart } from '@/components/charts'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getFieldTimeSeries,
  getGroupedStackedTimeSeries,
  type ChartableField,
  type DateField,
  type TimeSeriesData,
  type GroupByOption,
  type AggregationMethod,
  type SplitByField,
  type GroupedStackedData,
} from '@/app/dashboard/forms/actions'

interface InteractiveChartProps {
  formId: string
  dateFields: DateField[]
  chartableFields: ChartableField[]
  splitByFields: SplitByField[]
}

export function InteractiveChart({
  formId,
  dateFields,
  chartableFields,
  splitByFields,
}: InteractiveChartProps) {
  const t = useTranslations('forms')

  // Chart selection state
  const [selectedDateField, setSelectedDateField] = useState<string>(() =>
    dateFields.length > 0 ? dateFields[0].id : ''
  )
  const [selectedValueField, setSelectedValueField] = useState<string>(() =>
    chartableFields.length > 0 ? chartableFields[0].id : ''
  )
  const [selectedSplitByField, setSelectedSplitByField] = useState<string>('')
  const [groupBy, setGroupBy] = useState<GroupByOption>('date')
  const [aggregation, setAggregation] = useState<AggregationMethod>('sum')

  // Chart data state
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null)
  const [groupedStackedData, setGroupedStackedData] = useState<GroupedStackedData | null>(null)
  const [loading, setLoading] = useState(false)

  // Get selected field info for chart
  const selectedField = chartableFields.find((f) => f.id === selectedValueField)

  // Load time series data when selections change
  const loadTimeSeries = useCallback(async () => {
    if (!selectedDateField || !selectedValueField) {
      setTimeSeriesData(null)
      setGroupedStackedData(null)
      return
    }

    setLoading(true)

    // Check if selected field is a select type
    const field = chartableFields.find((f) => f.id === selectedValueField)
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
    setLoading(false)
  }, [
    formId,
    selectedDateField,
    selectedValueField,
    groupBy,
    aggregation,
    selectedSplitByField,
    chartableFields,
  ])

  useEffect(() => {
    loadTimeSeries()
  }, [loadTimeSeries])

  if (dateFields.length === 0 || chartableFields.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">{t('analytics.responsesOverTime')}</h3>

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Value Field Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('analytics.showField')}:</span>
          <Select value={selectedValueField} onValueChange={setSelectedValueField}>
            <SelectTrigger className="w-[200px] border border-black/20 dark:border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-black/20 dark:border-white/20">
              {chartableFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Field Selector (only if multiple date fields) */}
        {dateFields.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('analytics.dateField')}:</span>
            <Select value={selectedDateField} onValueChange={setSelectedDateField}>
              <SelectTrigger className="w-[200px] border border-black/20 dark:border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-black/20 dark:border-white/20">
                {dateFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Group By Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('analytics.groupBy')}:</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
            <SelectTrigger className="w-[130px] border border-black/20 dark:border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border border-black/20 dark:border-white/20">
              <SelectItem value="date">{t('analytics.perDate')}</SelectItem>
              <SelectItem value="week">{t('analytics.perWeek')}</SelectItem>
              <SelectItem value="month">{t('analytics.perMonth')}</SelectItem>
              <SelectItem value="year">{t('analytics.perYear')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number field specific options */}
        {selectedField?.type === 'number' && (
          <>
            {/* Aggregation Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('analytics.aggregation')}:</span>
              <Select
                value={aggregation}
                onValueChange={(v) => setAggregation(v as AggregationMethod)}
              >
                <SelectTrigger className="w-[130px] border border-black/20 dark:border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-black/20 dark:border-white/20">
                  <SelectItem value="sum">{t('analytics.sum')}</SelectItem>
                  <SelectItem value="average">{t('analytics.avg')}</SelectItem>
                  <SelectItem value="median">{t('analytics.median')}</SelectItem>
                  <SelectItem value="min">{t('analytics.min')}</SelectItem>
                  <SelectItem value="max">{t('analytics.max')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Split By Selector */}
            {splitByFields.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('analytics.splitBy')}:</span>
                <Select
                  value={selectedSplitByField || 'none'}
                  onValueChange={(v) => setSelectedSplitByField(v === 'none' ? '' : v)}
                >
                  <SelectTrigger className="w-[180px] border border-black/20 dark:border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-black/20 dark:border-white/20">
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

      {/* Chart */}
      <Card className="border border-black/20 dark:border-white/20">
        <CardContent className="pt-4">
          {loading ? (
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
                  lines={timeSeriesData.splitByOptions.map(
                    (opt: { value: string; label: string; color: string }) => ({
                      dataKey: opt.value,
                      name: opt.label,
                      color: opt.color,
                    })
                  )}
                />
              ) : (
                <LineChart
                  data={timeSeriesData.data}
                  xAxisKey="date"
                  lines={[{ dataKey: 'value', color: '#f49f1e', name: selectedField.label }]}
                />
              )
            ) : (
              // Fallback: stacked bar chart showing response counts per select option
              <StackedBarChart
                data={timeSeriesData.data}
                xAxisKey="date"
                bars={
                  timeSeriesData.options?.map(
                    (opt: { value: string; label: string; color: string }) => ({
                      dataKey: opt.value,
                      name: opt.label,
                      color: opt.color,
                    })
                  ) || []
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
  )
}
