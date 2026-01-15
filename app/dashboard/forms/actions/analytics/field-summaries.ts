'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import { getOptionHexColor } from './utils'
import type { FieldSummary, FieldSummaryData, FieldOption } from './types'

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
          const options = (field.options as FieldOption[]) || []
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
          const options = (field.options as FieldOption[]) || []
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
