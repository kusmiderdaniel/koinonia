'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface DateDistributionChartProps {
  data: Array<{
    date: string
    count: number
  }>
  color?: string
  className?: string
}

export function DateDistributionChart({
  data,
  color = '#f49f1e',
  className,
}: DateDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-8">No date responses yet</p>
      </div>
    )
  }

  // Sort by date
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))

  const formatDate = (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={sortedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatDate}
          />
          <YAxis
            tick={{ fontSize: 11 }}
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
              fontSize: '12px',
            }}
            labelFormatter={(label) => {
              if (typeof label === 'string') {
                const date = new Date(label)
                return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
              }
              return label
            }}
            formatter={(value) => {
              const num = value ?? 0
              return [`${num} response${num !== 1 ? 's' : ''}`, 'Selected']
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
