'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'

// Custom tooltip component with proper dark mode support
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload?: { name?: string }
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
        <span className="text-foreground">{payload[0]?.payload?.name}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        {tooltipLabel}: {payload[0]?.value ?? 0}
      </p>
    </div>
  )
}

const CHART_COLORS = [
  '#f49f1e', // brand
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
]

interface BarChartProps {
  data: Array<{
    name: string
    value: number
  }>
  color?: string
  colors?: string[]
  horizontal?: boolean
  className?: string
  tooltipLabel?: string
}

export function BarChart({
  data,
  color = '#f49f1e',
  colors,
  horizontal = false,
  className,
  tooltipLabel = 'Responses',
}: BarChartProps) {
  // Use provided colors array, falling back to default color
  const getBarColor = (index: number) => {
    if (colors && colors.length > 0) {
      const c = colors[index % colors.length]
      if (c) return c
    }
    return CHART_COLORS[index % CHART_COLORS.length]
  }
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
      </div>
    )
  }

  if (horizontal) {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
          <RechartsBarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip tooltipLabel={tooltipLabel} />}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            content={<CustomTooltip tooltipLabel={tooltipLabel} />}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
