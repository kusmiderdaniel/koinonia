'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { GrowthDataPoint } from './actions'

interface UserGrowthChartProps {
  data: GrowthDataPoint[]
}

const chartConfig = {
  cumulative: {
    label: 'Total Users',
    color: '#f49f1e',
  },
  count: {
    label: 'New Users',
    color: '#f49f1e',
  },
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillUsersCumulative" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-cumulative)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-cumulative)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="cumulative"
          type="monotone"
          fill="url(#fillUsersCumulative)"
          stroke="var(--color-cumulative)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
