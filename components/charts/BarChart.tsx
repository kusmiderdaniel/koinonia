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
              formatter={(value) => [value ?? 0, tooltipLabel]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid black',
                borderRadius: '6px',
                padding: '8px 12px',
              }}
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
            formatter={(value) => [value ?? 0, tooltipLabel]}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
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
