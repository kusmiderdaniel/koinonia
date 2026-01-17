'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import {
  TEXT_OPERATORS,
  SINGLE_SELECT_OPERATORS,
  MULTI_SELECT_OPERATORS,
  DATE_OPERATORS,
  ACTIONS,
} from './constants'
import { ValueInput } from './condition-row/ValueInput'
import type { BuilderCondition } from '../../../types'

interface ConditionRowProps {
  condition: BuilderCondition
  fields: {
    id: string
    label: string
    type: string
    options?: { value: string; label: string; color?: string | null }[] | null
  }[]
  onUpdate: (id: string, updates: Partial<BuilderCondition>) => void
  onDelete: (id: string) => void
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export const ConditionRow = memo(function ConditionRow({
  condition,
  fields,
  onUpdate,
  onDelete,
  weekStartsOn,
}: ConditionRowProps) {
  const t = useTranslations('forms')
  const isMobile = useIsMobile()
  const needsValue =
    condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty'
  const sourceField = fields.find((f) => f.id === condition.source_field_id)
  const sourceHasOptions =
    sourceField?.type === 'single_select' ||
    sourceField?.type === 'multi_select'
  const sourceIsDate = sourceField?.type === 'date'
  const sourceIsSingleSelect = sourceField?.type === 'single_select'
  const sourceIsMultiSelect = sourceField?.type === 'multi_select'
  const needsMultiValue =
    condition.operator === 'is_any_of' ||
    condition.operator === 'is_not_any_of' ||
    condition.operator === 'is_every_of'

  const operators = sourceIsDate
    ? DATE_OPERATORS
    : sourceIsSingleSelect
      ? SINGLE_SELECT_OPERATORS
      : sourceIsMultiSelect
        ? MULTI_SELECT_OPERATORS
        : TEXT_OPERATORS

  // Shared select class names
  const selectContentClassName = '!border !border-black/20 dark:!border-white/20'
  const labelClassName = isMobile ? 'text-[10px] text-muted-foreground' : 'text-xs text-muted-foreground'
  const triggerClassName = isMobile ? 'h-7 text-xs !border !border-black/20 dark:!border-white/20' : 'h-8 text-sm !border !border-black/20 dark:!border-white/20'
  const spacingClassName = isMobile ? 'space-y-1' : 'space-y-1.5'

  const handleValueChange = (value: string) => {
    onUpdate(condition.id, { value })
  }

  return (
    <div className={`border border-black/20 dark:border-white/20 rounded-lg bg-muted/30 ${isMobile ? 'space-y-2 p-2' : 'space-y-3 p-3'}`}>
      {/* Action & When - side by side on mobile */}
      {isMobile ? (
        <div className="grid grid-cols-2 gap-2">
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.action')}</Label>
            <Select
              value={condition.action}
              onValueChange={(value) =>
                onUpdate(condition.id, { action: value as 'show' | 'hide' })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {t(`conditions.${action.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.when')}</Label>
            <Select
              value={condition.source_field_id}
              onValueChange={(value) =>
                onUpdate(condition.id, { source_field_id: value, value: null })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={t('conditions.fieldMobile')} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <>
          {/* Action */}
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.action')}</Label>
            <Select
              value={condition.action}
              onValueChange={(value) =>
                onUpdate(condition.id, { action: value as 'show' | 'hide' })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {t(`conditions.${action.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* When field */}
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.when')}</Label>
            <Select
              value={condition.source_field_id}
              onValueChange={(value) =>
                onUpdate(condition.id, { source_field_id: value, value: null })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={t('conditions.fieldDesktop')} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Operator & Value - side by side on mobile when value is simple */}
      {isMobile && needsValue && !needsMultiValue ? (
        <div className="grid grid-cols-2 gap-2">
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.condition')}</Label>
            <Select
              value={condition.operator}
              onValueChange={(value) =>
                onUpdate(condition.id, {
                  operator: value as
                    | 'equals'
                    | 'not_equals'
                    | 'contains'
                    | 'is_empty'
                    | 'is_not_empty'
                    | 'before'
                    | 'after',
                })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {t(`operators.${op.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.value')}</Label>
            <ValueInput
              conditionId={condition.id}
              value={condition.value}
              isDate={sourceIsDate}
              hasOptions={sourceHasOptions}
              isMultiValue={needsMultiValue}
              options={sourceField?.options}
              isMobile={isMobile}
              weekStartsOn={weekStartsOn}
              onChange={handleValueChange}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Operator */}
          <div className={spacingClassName}>
            <Label className={labelClassName}>{t('conditions.condition')}</Label>
            <Select
              value={condition.operator}
              onValueChange={(value) =>
                onUpdate(condition.id, {
                  operator: value as
                    | 'equals'
                    | 'not_equals'
                    | 'contains'
                    | 'is_empty'
                    | 'is_not_empty'
                    | 'before'
                    | 'after',
                })
              }
            >
              <SelectTrigger className={triggerClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className={selectContentClassName}>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {t(`operators.${op.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value - only for multi-value or desktop */}
          {needsValue && (
            <div className={spacingClassName}>
              <Label className={labelClassName}>{t('conditions.value')}</Label>
              <ValueInput
                conditionId={condition.id}
                value={condition.value}
                isDate={sourceIsDate}
                hasOptions={sourceHasOptions}
                isMultiValue={needsMultiValue}
                options={sourceField?.options}
                isMobile={isMobile}
                weekStartsOn={weekStartsOn}
                onChange={handleValueChange}
              />
            </div>
          )}
        </>
      )}

      {/* Delete button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(condition.id)}
        className={`w-full !border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 ${isMobile ? 'h-7 text-xs' : ''}`}
      >
        <Trash2 className={isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1'} />
        {isMobile ? t('conditions.removeMobile') : t('conditions.removeDesktop')}
      </Button>
    </div>
  )
})
