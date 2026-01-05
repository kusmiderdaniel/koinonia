import type { Form, FormField, FormCondition } from '../../types'

export type { Form, FormField, FormCondition }

export interface FormBuilderClientProps {
  initialData: {
    form: Form
    fields: FormField[]
    conditions: FormCondition[]
    submissionsCount: number
    role: string
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  }
}

export interface FormStatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'outline'
}

export const statusConfig: Record<string, FormStatusConfig> = {
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  closed: { label: 'Closed', variant: 'outline' },
}
