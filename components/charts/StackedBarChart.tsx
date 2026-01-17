'use client'

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

// Custom tooltip component with proper dark mode support
interface CustomTooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: CustomTooltipPayloadItem[]
  label?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  // Format date label
  let formattedLabel = label
  if (typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(label)
    formattedLabel = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
  }

  // Filter out zero values
  const nonZeroPayload = payload.filter(item => item.value !== 0 && item.value != null)

  if (nonZeroPayload.length === 0) return null

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-foreground mb-1">{formattedLabel}</p>
      {nonZeroPayload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-foreground font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
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

interface StackedBarChartProps {
  data: Array<Record<string, unknown>>
  xAxisKey: string
  bars: Array<{
    dataKey: string
    name: string
    color?: string
  }>
  xAxisFormatter?: (value: string) => string
  className?: string
}

// Custom shape that rounds top corners only for the topmost segment in a stack
interface CustomBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: Record<string, unknown>
  dataKey?: string
  allBars?: Array<{ dataKey: string }>
}

function RoundedTopBar(props: CustomBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, fill, payload, dataKey, allBars = [] } = props

  if (!payload || !dataKey || height <= 0) {
    return null
  }

  // Check if this is the topmost segment by seeing if any bars above have values
  const currentIndex = allBars.findIndex(b => b.dataKey === dataKey)
  const barsAbove = allBars.slice(currentIndex + 1)
  const isTopmost = barsAbove.every(bar => {
    const value = payload[bar.dataKey]
    return value === null || value === undefined || value === 0
  })

  const radius = 8

  if (isTopmost) {
    // Draw rectangle with rounded top corners
    return (
      <path
        d={`
          M ${x},${y + radius}
          Q ${x},${y} ${x + radius},${y}
          L ${x + width - radius},${y}
          Q ${x + width},${y} ${x + width},${y + radius}
          L ${x + width},${y + height}
          L ${x},${y + height}
          Z
        `}
        fill={fill}
      />
    )
  }

  // Draw regular rectangle
  return <rect x={x} y={y} width={width} height={height} fill={fill} />
}

export function StackedBarChart({
  data,
  xAxisKey,
  bars,
  xAxisFormatter,
  className,
}: StackedBarChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
      </div>
    )
  }

  const formatXAxis = (value: string) => {
    if (xAxisFormatter) return xAxisFormatter(value)
    // Default: format date as DD/MM
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(value)
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    return value
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatXAxis}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip cursor={false} content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              stackId="stack"
              shape={(props: unknown) => <RoundedTopBar {...(props as CustomBarProps)} dataKey={bar.dataKey} allBars={bars} />}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
