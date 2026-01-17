'use client'

import { useState } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// Colors for number fields in the stack
const NUMBER_FIELD_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
]

interface GroupedStackedBarChartProps {
  data: Array<Record<string, unknown>>
  xAxisKey: string
  selectOptions: Array<{ value: string; label: string; color: string }>
  numberFields: Array<{ id: string; label: string }>
  xAxisFormatter?: (value: string) => string
  className?: string
}

// Custom shape that rounds top corners only for the topmost segment in a stack
// Also handles centering bars when some stacks have no data for a row
interface CustomBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: Record<string, unknown>
  dataKey?: string
  stackId?: string
  numberFieldIds?: string[]
  allStackIds?: string[]
  barGap?: number
  stackLabel?: string
}

function RoundedTopBar(props: CustomBarProps) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill,
    payload,
    dataKey,
    stackId,
    numberFieldIds = [],
    allStackIds = [],
    barGap = 4,
    stackLabel = '',
  } = props

  if (!payload || !dataKey || !stackId || height <= 0) {
    return null
  }

  // Calculate centering offset based on which stacks have data for this row
  const stacksWithData = allStackIds.filter(sid => {
    return numberFieldIds.some(fieldId => {
      const key = `${sid}_${fieldId}`
      const value = payload[key]
      return value !== null && value !== undefined && value !== 0
    })
  })

  const totalStacks = allStackIds.length
  const activeStacks = stacksWithData.length
  const currentStackIndex = allStackIds.indexOf(stackId)
  const activeStackIndex = stacksWithData.indexOf(stackId)

  // Calculate offset to center the active bars
  // Each bar takes up width + barGap space, we need to shift by the difference
  const totalWidth = totalStacks * width + (totalStacks - 1) * barGap
  const activeWidth = activeStacks * width + (activeStacks - 1) * barGap
  const baseOffset = (totalWidth - activeWidth) / 2

  // Calculate new x position
  // Original x is based on position in allStackIds, we need to reposition based on activeStackIndex
  const originalStackX = currentStackIndex * (width + barGap)
  const newStackX = activeStackIndex * (width + barGap) + baseOffset
  const xOffset = newStackX - originalStackX
  const adjustedX = x + xOffset

  // Extract the number field id from the dataKey (format: optionValue_fieldId)
  const currentFieldId = dataKey.split('_').slice(1).join('_')
  const currentIndex = numberFieldIds.indexOf(currentFieldId)

  // Check if this is the topmost segment by seeing if any segments above have values
  const fieldsAbove = numberFieldIds.slice(currentIndex + 1)
  const isTopmost = fieldsAbove.every(fieldId => {
    const key = `${stackId}_${fieldId}`
    const value = payload[key]
    return value === null || value === undefined || value === 0
  })

  // Check if this is the bottommost segment (all fields below have no data)
  const fieldsBelow = numberFieldIds.slice(0, currentIndex)
  const isBottommost = fieldsBelow.every(fieldId => {
    const key = `${stackId}_${fieldId}`
    const value = payload[key]
    return value === null || value === undefined || value === 0
  })

  const radius = 8

  // Render label below the bar for the bottommost segment only
  const labelElement = isBottommost && stackLabel ? (
    <text
      x={adjustedX + width / 2}
      y={y + height + 14}
      textAnchor="middle"
      fontSize={10}
      fill="#666"
    >
      {stackLabel}
    </text>
  ) : null

  if (isTopmost) {
    // Draw rectangle with rounded top corners
    return (
      <g>
        <path
          d={`
            M ${adjustedX},${y + radius}
            Q ${adjustedX},${y} ${adjustedX + radius},${y}
            L ${adjustedX + width - radius},${y}
            Q ${adjustedX + width},${y} ${adjustedX + width},${y + radius}
            L ${adjustedX + width},${y + height}
            L ${adjustedX},${y + height}
            Z
          `}
          fill={fill}
        />
        {labelElement}
      </g>
    )
  }

  // Draw regular rectangle
  return (
    <g>
      <rect x={adjustedX} y={y} width={width} height={height} fill={fill} />
      {labelElement}
    </g>
  )
}

// Custom tooltip that only shows data for the active (hovered) stack
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    name: string
    value: number
    fill: string
  }>
  label?: string
  activeStackId: string | null
  numberFields: Array<{ id: string; label: string }>
  selectOptions: Array<{ value: string; label: string }>
}

function CustomTooltip({ active, payload, label, activeStackId, numberFields, selectOptions }: CustomTooltipProps) {
  if (!active || !payload || !activeStackId) {
    return null
  }

  // Filter payload to only show items from the active stack
  const filteredPayload = payload.filter(item => {
    return item.dataKey.startsWith(`${activeStackId}_`)
  })

  // Filter out zero values
  const nonZeroPayload = filteredPayload.filter(item => item.value !== 0 && item.value != null)

  if (nonZeroPayload.length === 0) {
    return null
  }

  // Format the date label
  let formattedDate = label
  if (typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(label)
    formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
  }

  // Get the select option label for the header
  const selectOption = selectOptions.find(opt => opt.value === activeStackId)
  const optionLabel = selectOption?.label || activeStackId

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 shadow-md">
      <p className="font-semibold text-foreground">{optionLabel}</p>
      <p className="text-xs text-muted-foreground mb-1">{formattedDate}</p>
      {nonZeroPayload.map((item, index) => {
        // Extract just the field label from the name (format: "Option - Field")
        const fieldId = item.dataKey.split('_').slice(1).join('_')
        const field = numberFields.find(nf => nf.id === fieldId)
        const fieldLabel = field?.label || item.name

        return (
          <div key={index} className="flex items-center gap-1.5 mt-0.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-sm text-muted-foreground">{fieldLabel}:</span>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function GroupedStackedBarChart({
  data,
  xAxisKey,
  selectOptions,
  numberFields,
  xAxisFormatter,
  className,
}: GroupedStackedBarChartProps) {
  const [activeStackId, setActiveStackId] = useState<string | null>(null)

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

  // Filter out select options that have no data anywhere in the dataset
  // This prevents empty bar slots from taking up space
  const activeSelectOptions = selectOptions.filter((opt) => {
    // Check if this option has any non-zero values across all dates and number fields
    return data.some((row) => {
      return numberFields.some((nf) => {
        const key = `${opt.value}_${nf.id}`
        const value = row[key]
        return value !== null && value !== undefined && value !== 0
      })
    })
  })

  // Create bars for each select option and number field combination
  // Each select option gets its own stackId so bars are grouped side by side
  const bars: Array<{
    dataKey: string
    stackId: string
    fill: string
    name: string
    stackLabel: string
  }> = []

  activeSelectOptions.forEach((opt) => {
    numberFields.forEach((nf, nfIdx) => {
      bars.push({
        dataKey: `${opt.value}_${nf.id}`,
        stackId: opt.value, // Same stackId for same select option = stacked together
        fill: NUMBER_FIELD_COLORS[nfIdx % NUMBER_FIELD_COLORS.length],
        name: `${opt.label} - ${nf.label}`,
        stackLabel: opt.label,
      })
    })
  })

  const numberFieldIds = numberFields.map(nf => nf.id)
  const allStackIds = activeSelectOptions.map(opt => opt.value)

  // Custom legend that shows number fields only
  const renderLegend = () => {
    if (numberFields.length <= 1) {
      return null
    }

    return (
      <div className="flex flex-wrap justify-center gap-4 mb-2">
        {numberFields.map((nf, idx) => (
          <div key={nf.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: NUMBER_FIELD_COLORS[idx % NUMBER_FIELD_COLORS.length] }}
            />
            <span className="text-sm text-foreground">{nf.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={className}>
      {renderLegend()}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 30, bottom: 50 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, dy: 16 }}
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
            cursor={false}
            content={({ active, payload, label }) => (
              <CustomTooltip
                active={active}
                payload={payload as CustomTooltipProps['payload']}
                label={label as string}
                activeStackId={activeStackId}
                numberFields={numberFields}
                selectOptions={selectOptions}
              />
            )}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.fill}
              stackId={bar.stackId}
              onMouseEnter={() => setActiveStackId(bar.stackId)}
              onMouseLeave={() => setActiveStackId(null)}
              shape={(props: unknown) => (
                <RoundedTopBar
                  {...(props as CustomBarProps)}
                  dataKey={bar.dataKey}
                  stackId={bar.stackId}
                  numberFieldIds={numberFieldIds}
                  allStackIds={allStackIds}
                  stackLabel={bar.stackLabel}
                />
              )}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
