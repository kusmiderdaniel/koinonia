'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import { getOptionHexColor } from './utils'
import type { DateField, ChartableField, SplitByField, FieldOption } from './types'

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
      const rawOptions = field.options as FieldOption[] | null

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
