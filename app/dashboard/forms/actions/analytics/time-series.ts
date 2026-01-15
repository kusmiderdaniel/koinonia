'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import { getOptionHexColor, getGroupKey, aggregateNumbers } from './utils'
import type {
  TimeSeriesData,
  GroupedStackedData,
  GroupByOption,
  AggregationMethod,
  FieldOption,
} from './types'

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
    const rawOptions = valueField.options as FieldOption[] | null
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
        const rawSplitOptions = splitField.options as FieldOption[]
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

    const rawOptions = selectField.options as FieldOption[] | null
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
