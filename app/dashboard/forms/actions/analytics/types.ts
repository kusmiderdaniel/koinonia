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

export type FieldSummaryData =
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
  data: Array<Record<string, unknown>>
  fieldType: 'number' | 'single_select' | 'multi_select'
  options?: Array<{ value: string; label: string; color: string }>
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
  data: Array<Record<string, unknown>>
  selectOptions: Array<{ value: string; label: string; color: string }>
  numberFields: Array<{ id: string; label: string }>
}

export interface FieldOption {
  value: string
  label: string
  color?: string | null
}
