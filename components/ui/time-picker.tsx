"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value?: string // HH:mm format (24h internal)
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  timeFormat?: '12h' | '24h'
}

// Generate hour options based on format
function getHourOptions(timeFormat: '12h' | '24h') {
  if (timeFormat === '12h') {
    // 12-hour format: 01, 02, ..., 11, 12 (sorted numerically, zero-padded)
    return Array.from({ length: 12 }, (_, i) => {
      const displayHour = i + 1 // 1-12
      const internalHour = displayHour === 12 ? 0 : displayHour // internal: 0 = 12, 1-11 = 1-11
      return { value: internalHour.toString(), label: displayHour.toString().padStart(2, '0') }
    })
  }
  // 24-hour format: 00, 01, ..., 23
  return Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: i.toString().padStart(2, '0'),
  }))
}

// Generate minute options (00, 05, 10, ..., 55 for easier selection)
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: (i * 5).toString(),
  label: (i * 5).toString().padStart(2, '0'),
}))

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  id,
  timeFormat = '24h',
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse value (HH:mm format)
  const parsedTime = React.useMemo(() => {
    if (!value) return { hours: 9, minutes: 0 }
    const [h, m] = value.split(':').map(Number)
    return { hours: isNaN(h) ? 9 : h, minutes: isNaN(m) ? 0 : m }
  }, [value])

  // Get hour in 12h or 24h format for display
  const getHourValue = React.useCallback(() => {
    if (timeFormat === '12h') {
      return (parsedTime.hours % 12).toString()
    }
    return parsedTime.hours.toString()
  }, [parsedTime.hours, timeFormat])

  // Get minute value (rounded to nearest 5)
  const getMinuteValue = React.useCallback(() => {
    const rounded = Math.round(parsedTime.minutes / 5) * 5
    return (rounded >= 60 ? 55 : rounded).toString()
  }, [parsedTime.minutes])

  // Get AM/PM value
  const getPeriodValue = React.useCallback(() => {
    return parsedTime.hours >= 12 ? "PM" : "AM"
  }, [parsedTime.hours])

  // Build time string in HH:mm format (24h internal)
  const buildTimeString = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Handle hour change
  const handleHourChange = (hourValue: string) => {
    let hours = parseInt(hourValue, 10)

    if (timeFormat === '12h') {
      const currentPeriod = getPeriodValue()
      if (currentPeriod === 'PM' && hours !== 12) {
        hours += 12
      } else if (currentPeriod === 'AM' && hours === 12) {
        hours = 0
      }
    }

    onChange?.(buildTimeString(hours, parsedTime.minutes))
  }

  // Handle minute change
  const handleMinuteChange = (minuteValue: string) => {
    const minutes = parseInt(minuteValue, 10)
    onChange?.(buildTimeString(parsedTime.hours, minutes))
  }

  // Handle AM/PM change
  const handlePeriodChange = (period: string) => {
    let hours = parsedTime.hours
    const currentPeriod = hours >= 12 ? 'PM' : 'AM'

    if (period !== currentPeriod) {
      if (period === 'PM') {
        hours = hours === 0 ? 12 : hours + 12
      } else {
        hours = hours === 12 ? 0 : hours - 12
      }
    }

    onChange?.(buildTimeString(hours, parsedTime.minutes))
  }

  // Display value
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder
    const { hours, minutes } = parsedTime
    if (timeFormat === '12h') {
      const displayHour = hours % 12 || 12
      const period = hours >= 12 ? 'PM' : 'AM'
      return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }, [value, parsedTime, timeFormat, placeholder])

  const hourOptions = React.useMemo(() => getHourOptions(timeFormat), [timeFormat])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal !border !border-black/20 dark:!border-white/20",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20 shadow-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="flex items-center gap-2">
          {/* Hour Select */}
          <Select value={getHourValue()} onValueChange={handleHourChange}>
            <SelectTrigger className="w-[70px] h-8 text-sm !border !border-black/20 dark:!border-white/20 bg-zinc-100 dark:bg-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] !border !border-black/20 dark:!border-white/20">
              {hourOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">:</span>

          {/* Minute Select */}
          <Select value={getMinuteValue()} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-[60px] h-8 text-sm !border !border-black/20 dark:!border-white/20 bg-zinc-100 dark:bg-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] !border !border-black/20 dark:!border-white/20">
              {MINUTE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AM/PM Select (only for 12h format) */}
          {timeFormat === '12h' && (
            <Select value={getPeriodValue()} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[65px] h-8 text-sm !border !border-black/20 dark:!border-white/20 bg-zinc-100 dark:bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!border !border-black/20 dark:!border-white/20">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
