'use client'

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Custom tooltip component with proper dark mode support
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
  }>
  tooltipLabel: string
}

function CustomTooltip({
  active,
  payload,
  tooltipLabel
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 shadow-md">
      <p className="text-sm">
        <span className="text-foreground">{payload[0]?.name}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        {tooltipLabel}: {payload[0]?.value ?? 0}
      </p>
    </div>
  )
}

interface PieChartProps {
  data: Array<{
    name: string
    value: number
  }>
  colors?: string[]
  showLegend?: boolean
  className?: string
  tooltipLabel?: string
}

const DEFAULT_COLORS = [
  '#f49f1e', // brand
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
]

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  showLegend = true,
  className,
  tooltipLabel = 'Responses',
}: PieChartProps) {
  // Filter out zero values for cleaner chart
  const filteredData = data.filter((d) => d.value > 0)

  if (filteredData.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <RechartsPieChart margin={{ top: 20, bottom: 20 }}>
          <Pie
            data={filteredData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ percent }) =>
              (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {filteredData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip tooltipLabel={tooltipLabel} />}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={10}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
