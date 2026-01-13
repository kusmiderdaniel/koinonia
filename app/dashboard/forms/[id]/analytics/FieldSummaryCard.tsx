'use client'

import { useTranslations } from 'next-intl'
import { Calendar, ArrowRight } from 'lucide-react'
import { PieChart, BarChart } from '@/components/charts'
import { Card, CardContent } from '@/components/ui/card'
import type { FieldSummary } from '@/app/dashboard/forms/actions'

function formatDateDDMMYYYY(dateString: string): string {
  const date = new Date(dateString)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

interface FieldSummaryCardProps {
  summary: FieldSummary
}

export function FieldSummaryCard({ summary }: FieldSummaryCardProps) {
  const t = useTranslations('forms')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{summary.fieldLabel}</h4>
        <span className="text-xs text-muted-foreground">
          {summary.responseCount} {t('analytics.responses')}
        </span>
      </div>
      <Card className="border border-black dark:border-white">
        <CardContent className="pt-4">
          {summary.data.type === 'select' && (
            <BarChart
              data={summary.data.options.map((opt) => ({
                name: opt.label,
                value: opt.count,
              }))}
              colors={summary.data.options.map((opt) => opt.color)}
              horizontal
              className="min-h-[100px]"
              tooltipLabel={t('analytics.responses')}
            />
          )}

          {summary.data.type === 'checkbox' && (
            <PieChart
              data={[
                { name: t('analytics.yes'), value: summary.data.trueCount },
                { name: t('analytics.no'), value: summary.data.falseCount },
              ]}
              colors={['#10b981', '#ef4444']}
              className="max-h-[200px]"
              tooltipLabel={t('analytics.responses')}
            />
          )}

          {summary.data.type === 'number' && (
            <div className="grid grid-cols-4 gap-4 text-center pb-4">
              <div>
                <p className="text-2xl font-bold">{summary.data.min}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.min')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.data.max}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.max')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.data.avg}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.average')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.data.median}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.median')}</p>
              </div>
            </div>
          )}

          {summary.data.type === 'date' && (
            <div className="flex items-center justify-center gap-4 min-h-[100px]">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">{t('analytics.from')}</span>
                </div>
                <p className="text-xl font-semibold">
                  {summary.data.min ? formatDateDDMMYYYY(summary.data.min) : '-'}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">{t('analytics.to')}</span>
                </div>
                <p className="text-xl font-semibold">
                  {summary.data.max ? formatDateDDMMYYYY(summary.data.max) : '-'}
                </p>
              </div>
            </div>
          )}

          {summary.data.type === 'text' && (
            <p className="text-muted-foreground text-sm">
              {summary.data.count} {t('analytics.textResponses')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
