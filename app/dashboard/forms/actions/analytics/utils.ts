import { OPTION_COLOR_HEX, DEFAULT_CHART_COLORS } from './constants'
import type { GroupByOption, AggregationMethod } from './types'

/**
 * Get hex color for a field option
 */
export function getOptionHexColor(colorName: string | null | undefined, fallbackIndex: number): string {
  if (colorName && OPTION_COLOR_HEX[colorName]) {
    return OPTION_COLOR_HEX[colorName]
  }
  return DEFAULT_CHART_COLORS[fallbackIndex % DEFAULT_CHART_COLORS.length]
}

/**
 * Get the group key based on groupBy option for time series aggregation
 */
export function getGroupKey(dateString: string, groupBy: GroupByOption): string {
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

/**
 * Aggregate numbers based on aggregation method
 */
export function aggregateNumbers(values: number[], method: AggregationMethod): number {
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
