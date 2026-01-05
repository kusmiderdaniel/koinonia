export const TEXT_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
] as const

export const SINGLE_SELECT_OPERATORS = [
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'is_any_of', label: 'Is any of' },
  { value: 'is_not_any_of', label: 'Is not any of' },
] as const

export const MULTI_SELECT_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'does_not_contain', label: 'Does not contain' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'is_any_of', label: 'Is any of' },
  { value: 'is_not_any_of', label: 'Is not any of' },
  { value: 'is_every_of', label: 'Is every of' },
] as const

export const DATE_OPERATORS = [
  { value: 'equals', label: 'Is on' },
  { value: 'before', label: 'Is before' },
  { value: 'before_or_equal', label: 'Is on or before' },
  { value: 'after', label: 'Is after' },
  { value: 'after_or_equal', label: 'Is on or after' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
] as const

export const ACTIONS = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
] as const
