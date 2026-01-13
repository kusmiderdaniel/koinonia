'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

interface LineChartProps {
  data: Array<Record<string, unknown>>
  lines: Array<{
    dataKey: string
    color: string
    name?: string
  }>
  xAxisKey: string
  xAxisFormatter?: (value: string) => string
  className?: string
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  xAxisFormatter,
  className,
}: LineChartProps) {
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
      <ResponsiveContainer width="100%" height={250}>
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid black',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            labelFormatter={(label) => {
              if (typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const date = new Date(label)
                return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
              }
              return label
            }}
          />
          {lines.length > 1 && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={10}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          )}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: line.color, strokeWidth: 0 }}
              name={line.name || line.dataKey}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
