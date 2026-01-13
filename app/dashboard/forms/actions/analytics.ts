'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'

// Map option color names to hex colors for charts
const OPTION_COLOR_HEX: Record<string, string> = {
  gray: '#71717a',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
}

// Default chart colors when no specific color is set
const DEFAULT_CHART_COLORS = [
  '#f49f1e', // brand
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
]

function getOptionHexColor(colorName: string | null | undefined, fallbackIndex: number): string {
  if (colorName && OPTION_COLOR_HEX[colorName]) {
    return OPTION_COLOR_HEX[colorName]
  }
  return DEFAULT_CHART_COLORS[fallbackIndex % DEFAULT_CHART_COLORS.length]
}

export interface FormAnalytics {
  totals: {
    views: number
    starts: number
    submissions: number
    completionRate: number
  }
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  timeline: Array<{
    date: string
    views: number
    starts: number
    submissions: number
  }>
}

export interface FieldSummary {
  fieldId: string
  fieldLabel: string
  fieldType: string
  responseCount: number
  data: FieldSummaryData
}

type FieldSummaryData =
  | { type: 'select'; options: Array<{ value: string; label: string; count: number; color: string }> }
  | { type: 'checkbox'; trueCount: number; falseCount: number }
  | { type: 'number'; min: number; max: number; avg: number; median: number }
  | { type: 'date'; dates: Array<{ date: string; count: number }>; min: string; max: string }
  | { type: 'text'; count: number }

export interface ChartableField {
  id: string
  label: string
  type: 'number' | 'single_select' | 'multi_select'
  options?: Array<{ value: string; label: string; color: string }>
}

export interface DateField {
  id: string
  label: string
}

export interface TimeSeriesData {
  // For number fields: array of {date, value} or {date, [option1]: value, [option2]: value, ...} when split
  // For select fields: array of {date, [option1]: count, [option2]: count, ...}
  data: Array<Record<string, unknown>>
  fieldType: 'number' | 'single_select' | 'multi_select'
  options?: Array<{ value: string; label: string; color: string }>
  // When number field is split by a select field, this contains the split field options
  splitByOptions?: Array<{ value: string; label: string; color: string }>
}

export interface SplitByField {
  id: string
  label: string
  options: Array<{ value: string; label: string; color: string }>
}

export type GroupByOption = 'date' | 'week' | 'month' | 'year'
export type AggregationMethod = 'sum' | 'average' | 'median' | 'min' | 'max'

export interface GroupedStackedData {
  // Array of { date, [optionValue_fieldId]: value, ... }
  data: Array<Record<string, unknown>>
  // Select field options (each becomes a group of bars)
  selectOptions: Array<{ value: string; label: string; color: string }>
  // Number fields (each becomes a segment in the stacked bars)
  numberFields: Array<{ id: string; label: string }>
}

export async function getFormAnalytics(
  formId: string,
  days?: number
): Promise<{ data?: FormAnalytics; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission - only leaders+ can view analytics
  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  // Calculate start date only if days filter is specified
  let startDate: Date | null = null
  if (days !== undefined) {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
  }

  try {
    // Get analytics events
    let eventsQuery = adminClient
      .from('form_analytics_events')
      .select('event_type, device_type, created_at')
      .eq('form_id', formId)

    if (startDate) {
      eventsQuery = eventsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) {
      console.error('Error fetching analytics events:', eventsError)
      return { error: 'Failed to load analytics' }
    }

    // Get submission count
    let submissionCountQuery = adminClient
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId)

    if (startDate) {
      submissionCountQuery = submissionCountQuery.gte('submitted_at', startDate.toISOString())
    }

    const { count: submissionCount } = await submissionCountQuery

    // Aggregate totals
    const views = events?.filter((e) => e.event_type === 'view').length || 0
    const starts = events?.filter((e) => e.event_type === 'start').length || 0
    const submissions = submissionCount || 0
    const completionRate = starts > 0 ? Math.round((submissions / starts) * 100) : 0

    // Device breakdown
    const deviceBreakdown = {
      desktop: events?.filter((e) => e.device_type === 'desktop').length || 0,
      mobile: events?.filter((e) => e.device_type === 'mobile').length || 0,
      tablet: events?.filter((e) => e.device_type === 'tablet').length || 0,
    }

    // Build daily counts
    const dailyCounts: Record<string, { views: number; starts: number; submissions: number }> = {}

    events?.forEach((e) => {
      const date = e.created_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      if (e.event_type === 'view') dailyCounts[date].views++
      if (e.event_type === 'start') dailyCounts[date].starts++
    })

    // Get submissions by date
    let submissionsByDateQuery = adminClient
      .from('form_submissions')
      .select('submitted_at')
      .eq('form_id', formId)

    if (startDate) {
      submissionsByDateQuery = submissionsByDateQuery.gte('submitted_at', startDate.toISOString())
    }

    const { data: submissionsByDate } = await submissionsByDateQuery

    submissionsByDate?.forEach((s) => {
      const date = s.submitted_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      dailyCounts[date].submissions++
    })

    // Convert to sorted array
    const timeline = Object.entries(dailyCounts)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      data: {
        totals: {
          views,
          starts,
          submissions,
          completionRate,
        },
        deviceBreakdown,
        timeline,
      },
    }
  } catch (error) {
    console.error('Error in getFormAnalytics:', error)
    return { error: 'Failed to load analytics' }
  }
}

export async function getFieldSummaries(
  formId: string
): Promise<{ data?: FieldSummary[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  try {
    // Get form fields
    const { data: fields, error: fieldsError } = await adminClient
      .from('form_fields')
      .select('id, label, type, options')
      .eq('form_id', formId)
      .order('sort_order')

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError)
      return { error: 'Failed to load form fields' }
    }

    // Get all submissions
    const { data: submissions, error: subError } = await adminClient
      .from('form_submissions')
      .select('responses')
      .eq('form_id', formId)

    if (subError) {
      console.error('Error fetching submissions:', subError)
      return { error: 'Failed to load submissions' }
    }

    // Process each field
    const summaries: FieldSummary[] = []

    for (const field of fields || []) {
      // Extract values for this field from all submissions
      const values: unknown[] = []
      submissions?.forEach((sub) => {
        const responses = sub.responses as Record<string, unknown>
        if (responses[field.id] !== undefined && responses[field.id] !== null) {
          values.push(responses[field.id])
        }
      })

      let data: FieldSummaryData

      switch (field.type) {
        case 'single_select': {
          const options = (field.options as Array<{ value: string; label: string; color?: string | null }>) || []
          const counts: Record<string, number> = {}
          values.forEach((v) => {
            const val = v as string
            counts[val] = (counts[val] || 0) + 1
          })
          data = {
            type: 'select',
            options: options.map((opt, idx) => ({
              value: opt.value,
              label: opt.label,
              count: counts[opt.value] || 0,
              color: getOptionHexColor(opt.color, idx),
            })),
          }
          break
        }

        case 'multi_select': {
          const options = (field.options as Array<{ value: string; label: string; color?: string | null }>) || []
          const counts: Record<string, number> = {}
          values.forEach((v) => {
            const arr = v as string[]
            arr.forEach((item) => {
              counts[item] = (counts[item] || 0) + 1
            })
          })
          data = {
            type: 'select',
            options: options.map((opt, idx) => ({
              value: opt.value,
              label: opt.label,
              count: counts[opt.value] || 0,
              color: getOptionHexColor(opt.color, idx),
            })),
          }
          break
        }

        case 'checkbox': {
          let trueCount = 0
          let falseCount = 0
          values.forEach((v) => {
            if (v === true) trueCount++
            else falseCount++
          })
          data = { type: 'checkbox', trueCount, falseCount }
          break
        }

        case 'number': {
          const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n))
          if (nums.length === 0) {
            data = { type: 'number', min: 0, max: 0, avg: 0, median: 0 }
          } else {
            const sorted = [...nums].sort((a, b) => a - b)
            const min = sorted[0]
            const max = sorted[sorted.length - 1]
            const avg = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
            const mid = Math.floor(sorted.length / 2)
            const median =
              sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
            data = { type: 'number', min, max, avg, median }
          }
          break
        }

        case 'date': {
          const dates = values.map((v) => v as string).filter((d) => d)
          const dateCounts: Record<string, number> = {}
          dates.forEach((d) => {
            dateCounts[d] = (dateCounts[d] || 0) + 1
          })
          const sortedDates = Object.keys(dateCounts).sort()
          data = {
            type: 'date',
            dates: Object.entries(dateCounts)
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date)),
            min: sortedDates[0] || '',
            max: sortedDates[sortedDates.length - 1] || '',
          }
          break
        }

        default:
          // text, textarea, email
          data = { type: 'text', count: values.length }
      }

      summaries.push({
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        responseCount: values.length,
        data,
      })
    }

    return { data: summaries }
  } catch (error) {
    console.error('Error in getFieldSummaries:', error)
    return { error: 'Failed to load field summaries' }
  }
}

export async function getChartableFields(
  formId: string
): Promise<{ dateFields?: DateField[]; chartableFields?: ChartableField[]; splitByFields?: SplitByField[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  try {
    const { data: fields, error: fieldsError } = await adminClient
      .from('form_fields')
      .select('id, label, type, options')
      .eq('form_id', formId)
      .order('sort_order')

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError)
      return { error: 'Failed to load fields' }
    }

    const dateFields: DateField[] = []
    const chartableFields: ChartableField[] = []
    const splitByFields: SplitByField[] = []

    for (const field of fields || []) {
      const rawOptions = field.options as Array<{ value: string; label: string; color?: string | null }> | null

      if (field.type === 'date') {
        dateFields.push({ id: field.id, label: field.label })
      } else if (field.type === 'number' || field.type === 'single_select' || field.type === 'multi_select') {
        chartableFields.push({
          id: field.id,
          label: field.label,
          type: field.type as 'number' | 'single_select' | 'multi_select',
          options: rawOptions?.map((opt, idx) => ({
            value: opt.value,
            label: opt.label,
            color: getOptionHexColor(opt.color, idx),
          })),
        })
      }
      // Select fields can be used to split number data into separate lines
      if (field.type === 'single_select' && rawOptions) {
        splitByFields.push({
          id: field.id,
          label: field.label,
          options: rawOptions.map((opt, idx) => ({
            value: opt.value,
            label: opt.label,
            color: getOptionHexColor(opt.color, idx),
          })),
        })
      }
    }

    return { dateFields, chartableFields, splitByFields }
  } catch (error) {
    console.error('Error in getChartableFields:', error)
    return { error: 'Failed to load fields' }
  }
}

// Helper function to get the group key based on groupBy option
function getGroupKey(dateString: string, groupBy: GroupByOption): string {
  const date = new Date(dateString)

  switch (groupBy) {
    case 'date':
      return dateString // Keep as-is (YYYY-MM-DD)
    case 'week': {
      // Get ISO week start (Monday)
      const d = new Date(date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      d.setDate(diff)
      return d.toISOString().split('T')[0]
    }
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    case 'year':
      return `${date.getFullYear()}`
    default:
      return dateString
  }
}

// Helper function to aggregate numbers based on method
function aggregateNumbers(values: number[], method: AggregationMethod): number {
  if (values.length === 0) return 0

  switch (method) {
    case 'sum':
      return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100
    case 'average':
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      return Math.round(median * 100) / 100
    }
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
  }
}

export async function getFieldTimeSeries(
  formId: string,
  dateFieldId: string,
  valueFieldId: string,
  groupBy: GroupByOption = 'date',
  aggregation: AggregationMethod = 'sum',
  splitByFieldId?: string
): Promise<{ data?: TimeSeriesData; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  try {
    // Get the value field info
    const { data: valueField, error: fieldError } = await adminClient
      .from('form_fields')
      .select('type, options')
      .eq('id', valueFieldId)
      .single()

    if (fieldError || !valueField) {
      return { error: 'Field not found' }
    }

    const fieldType = valueField.type as 'number' | 'single_select' | 'multi_select'
    const rawOptions = valueField.options as Array<{ value: string; label: string; color?: string | null }> | null
    const options = rawOptions?.map((opt, idx) => ({
      value: opt.value,
      label: opt.label,
      color: getOptionHexColor(opt.color, idx),
    }))

    // Get split field options if splitting
    let splitByOptions: Array<{ value: string; label: string; color: string }> | undefined
    if (splitByFieldId && fieldType === 'number') {
      const { data: splitField } = await adminClient
        .from('form_fields')
        .select('options')
        .eq('id', splitByFieldId)
        .single()

      if (splitField?.options) {
        const rawSplitOptions = splitField.options as Array<{ value: string; label: string; color?: string | null }>
        splitByOptions = rawSplitOptions.map((opt, idx) => ({
          value: opt.value,
          label: opt.label,
          color: getOptionHexColor(opt.color, idx),
        }))
      }
    }

    // Get all submissions
    const { data: submissions, error: subError } = await adminClient
      .from('form_submissions')
      .select('responses')
      .eq('form_id', formId)

    if (subError) {
      return { error: 'Failed to load submissions' }
    }

    if (fieldType === 'number') {
      if (splitByFieldId && splitByOptions) {
        // Aggregate number values by grouped date AND split by select field
        // Structure: { [groupKey]: { [splitValue]: number[] } }
        const groupedSplitValues: Record<string, Record<string, number[]>> = {}

        submissions?.forEach((sub) => {
          const responses = sub.responses as Record<string, unknown>
          const dateValue = responses[dateFieldId] as string
          const numValue = responses[valueFieldId]
          const splitValue = responses[splitByFieldId] as string

          if (dateValue && numValue !== undefined && numValue !== null && splitValue) {
            const num = Number(numValue)
            if (!isNaN(num)) {
              const groupKey = getGroupKey(dateValue, groupBy)
              if (!groupedSplitValues[groupKey]) {
                groupedSplitValues[groupKey] = {}
              }
              if (!groupedSplitValues[groupKey][splitValue]) {
                groupedSplitValues[groupKey][splitValue] = []
              }
              groupedSplitValues[groupKey][splitValue].push(num)
            }
          }
        })

        // Convert to array format with each split option as a key
        const data = Object.entries(groupedSplitValues)
          .map(([date, splitData]) => {
            const row: Record<string, unknown> = { date }
            for (const opt of splitByOptions!) {
              const values = splitData[opt.value] || []
              row[opt.value] = values.length > 0 ? aggregateNumbers(values, aggregation) : null
            }
            return row
          })
          .sort((a, b) => (a.date as string).localeCompare(b.date as string))

        return { data: { data, fieldType, splitByOptions } }
      } else {
        // Aggregate number values by grouped date (no split)
        const groupedValues: Record<string, number[]> = {}

        submissions?.forEach((sub) => {
          const responses = sub.responses as Record<string, unknown>
          const dateValue = responses[dateFieldId] as string
          const numValue = responses[valueFieldId]

          if (dateValue && numValue !== undefined && numValue !== null) {
            const num = Number(numValue)
            if (!isNaN(num)) {
              const groupKey = getGroupKey(dateValue, groupBy)
              if (!groupedValues[groupKey]) {
                groupedValues[groupKey] = []
              }
              groupedValues[groupKey].push(num)
            }
          }
        })

        // Apply aggregation method
        const data = Object.entries(groupedValues)
          .map(([date, values]) => ({
            date,
            value: aggregateNumbers(values, aggregation),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        return { data: { data, fieldType, options: undefined } }
      }
    } else {
      // Aggregate select values by grouped date
      const groupedCounts: Record<string, Record<string, number>> = {}

      submissions?.forEach((sub) => {
        const responses = sub.responses as Record<string, unknown>
        const dateValue = responses[dateFieldId] as string
        const selectValue = responses[valueFieldId]

        if (dateValue && selectValue !== undefined && selectValue !== null) {
          const groupKey = getGroupKey(dateValue, groupBy)
          if (!groupedCounts[groupKey]) {
            groupedCounts[groupKey] = {}
          }

          if (fieldType === 'multi_select' && Array.isArray(selectValue)) {
            selectValue.forEach((v) => {
              groupedCounts[groupKey][v] = (groupedCounts[groupKey][v] || 0) + 1
            })
          } else if (typeof selectValue === 'string') {
            groupedCounts[groupKey][selectValue] = (groupedCounts[groupKey][selectValue] || 0) + 1
          }
        }
      })

      // Convert to array format for chart
      const data = Object.entries(groupedCounts)
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => (a.date as string).localeCompare(b.date as string))

      return { data: { data, fieldType, options: options || undefined } }
    }
  } catch (error) {
    console.error('Error in getFieldTimeSeries:', error)
    return { error: 'Failed to load time series data' }
  }
}

/**
 * Get grouped stacked bar data for a select field.
 * For each date and select option combination, aggregates all number fields.
 *
 * Data structure for chart:
 * - X-axis: dates
 * - For each date: multiple bars side by side (one per select option)
 * - Each bar is stacked by number fields
 */
export async function getGroupedStackedTimeSeries(
  formId: string,
  dateFieldId: string,
  selectFieldId: string,
  groupBy: GroupByOption = 'date',
  aggregation: AggregationMethod = 'sum'
): Promise<{ data?: GroupedStackedData; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  try {
    // Get all fields for this form
    const { data: fields, error: fieldsError } = await adminClient
      .from('form_fields')
      .select('id, label, type, options')
      .eq('form_id', formId)
      .order('sort_order')

    if (fieldsError) {
      return { error: 'Failed to load form fields' }
    }

    // Find the select field
    const selectField = fields?.find(f => f.id === selectFieldId)
    if (!selectField || (selectField.type !== 'single_select' && selectField.type !== 'multi_select')) {
      return { error: 'Select field not found' }
    }

    const rawOptions = selectField.options as Array<{ value: string; label: string; color?: string | null }> | null
    if (!rawOptions || rawOptions.length === 0) {
      return { error: 'Select field has no options' }
    }

    const selectOptions = rawOptions.map((opt, idx) => ({
      value: opt.value,
      label: opt.label,
      color: getOptionHexColor(opt.color, idx),
    }))

    // Find all number fields in the form
    const numberFields = fields?.filter(f => f.type === 'number').map(f => ({
      id: f.id,
      label: f.label,
    })) || []

    if (numberFields.length === 0) {
      return { error: 'No number fields in form' }
    }

    // Get all submissions
    const { data: submissions, error: subError } = await adminClient
      .from('form_submissions')
      .select('responses')
      .eq('form_id', formId)

    if (subError) {
      return { error: 'Failed to load submissions' }
    }

    // Aggregate: { [groupKey]: { [selectValue]: { [numberFieldId]: number[] } } }
    const grouped: Record<string, Record<string, Record<string, number[]>>> = {}

    submissions?.forEach((sub) => {
      const responses = sub.responses as Record<string, unknown>
      const dateValue = responses[dateFieldId] as string
      const selectValue = responses[selectFieldId]

      if (!dateValue || selectValue === undefined || selectValue === null) return

      const groupKey = getGroupKey(dateValue, groupBy)
      if (!grouped[groupKey]) {
        grouped[groupKey] = {}
      }

      // Handle both single and multi select
      const selectValues = Array.isArray(selectValue) ? selectValue : [selectValue]

      for (const sv of selectValues) {
        if (typeof sv !== 'string') continue

        if (!grouped[groupKey][sv]) {
          grouped[groupKey][sv] = {}
        }

        // Collect values for each number field
        for (const nf of numberFields) {
          const numValue = responses[nf.id]
          if (numValue !== undefined && numValue !== null) {
            const num = Number(numValue)
            if (!isNaN(num)) {
              if (!grouped[groupKey][sv][nf.id]) {
                grouped[groupKey][sv][nf.id] = []
              }
              grouped[groupKey][sv][nf.id].push(num)
            }
          }
        }
      }
    })

    // Convert to flat data format for chart
    // Each row: { date, optionValue_fieldId: aggregatedValue, ... }
    const data = Object.entries(grouped)
      .map(([date, selectData]) => {
        const row: Record<string, unknown> = { date }

        for (const opt of selectOptions) {
          const optionData = selectData[opt.value] || {}
          for (const nf of numberFields) {
            const key = `${opt.value}_${nf.id}`
            const values = optionData[nf.id] || []
            row[key] = values.length > 0 ? aggregateNumbers(values, aggregation) : 0
          }
        }

        return row
      })
      .sort((a, b) => (a.date as string).localeCompare(b.date as string))

    return {
      data: {
        data,
        selectOptions,
        numberFields
      }
    }
  } catch (error) {
    console.error('Error in getGroupedStackedTimeSeries:', error)
    return { error: 'Failed to load grouped stacked data' }
  }
}
