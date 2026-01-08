"use client"

import * as React from "react"
import { format, isValid, setHours, setMinutes } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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

interface DateTimePickerProps {
  value?: string // ISO datetime string or datetime-local format
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  label?: string
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

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
  className,
  id,
  label,
  timeFormat = '24h',
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const date = new Date(value)
    return isValid(date) ? date : undefined
  }, [value])

  // Get hour in 12h or 24h format
  const getHourValue = React.useCallback(() => {
    if (!dateValue) return "9" // default to 9
    const hours = dateValue.getHours()
    if (timeFormat === '12h') {
      return (hours % 12).toString()
    }
    return hours.toString()
  }, [dateValue, timeFormat])

  // Get minute value (rounded to nearest 5)
  const getMinuteValue = React.useCallback(() => {
    if (!dateValue) return "0"
    const minutes = dateValue.getMinutes()
    // Round to nearest 5
    const rounded = Math.round(minutes / 5) * 5
    return (rounded >= 60 ? 55 : rounded).toString()
  }, [dateValue])

  // Get AM/PM value
  const getPeriodValue = React.useCallback(() => {
    if (!dateValue) return "AM"
    return dateValue.getHours() >= 12 ? "PM" : "AM"
  }, [dateValue])

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve existing time or use default
      const hours = dateValue?.getHours() ?? 9
      const minutes = dateValue?.getMinutes() ?? 0
      const newDate = setMinutes(setHours(date, hours), minutes)
      onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
    }
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

    const baseDate = dateValue || new Date()
    const minutes = dateValue?.getMinutes() ?? 0
    const newDate = setMinutes(setHours(baseDate, hours), minutes)
    onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
  }

  // Handle minute change
  const handleMinuteChange = (minuteValue: string) => {
    const minutes = parseInt(minuteValue, 10)
    const baseDate = dateValue || new Date()
    const hours = baseDate.getHours()
    const newDate = setMinutes(setHours(baseDate, hours), minutes)
    onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
  }

  // Handle AM/PM change
  const handlePeriodChange = (period: string) => {
    if (!dateValue) return

    let hours = dateValue.getHours()
    const currentPeriod = hours >= 12 ? 'PM' : 'AM'

    if (period !== currentPeriod) {
      if (period === 'PM') {
        hours = hours === 0 ? 12 : hours + 12
      } else {
        hours = hours === 12 ? 0 : hours - 12
      }
    }

    const newDate = setHours(dateValue, hours)
    onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
  }

  const displayValue = dateValue
    ? format(dateValue, timeFormat === '12h' ? "dd/MM/yyyy h:mm a" : "dd/MM/yyyy HH:mm")
    : placeholder

  const hourOptions = React.useMemo(() => getHourOptions(timeFormat), [timeFormat])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start font-normal !border !border-black dark:!border-white",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[calc(100vw-32px)] p-2 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg overflow-hidden"
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
        avoidCollisions={true}
      >
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleDateSelect}
          defaultMonth={dateValue || new Date()}
          classNames={{
            caption_label: "text-sm font-medium",
            month_caption: "flex justify-center relative items-center h-7 mx-16",
            nav: "absolute inset-x-0 flex items-center justify-between",
            button_previous: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
            button_next: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
            day: "text-center text-sm h-8 w-8 p-0",
            day_button: "h-8 w-8 p-0 font-normal text-sm",
            weekday: "text-muted-foreground w-8 font-normal text-xs text-center",
            week: "flex justify-between mt-1",
            months: "flex flex-col",
            month: "space-y-2",
          }}
          className="p-1"
        />
        <div className="border-t border-border mt-2 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            {/* Hour Select */}
            <Select value={getHourValue()} onValueChange={handleHourChange}>
              <SelectTrigger className="w-[70px] h-8 text-sm !border !border-black dark:!border-white bg-zinc-100 dark:bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] !border !border-black dark:!border-white">
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
              <SelectTrigger className="w-[60px] h-8 text-sm !border !border-black dark:!border-white bg-zinc-100 dark:bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] !border !border-black dark:!border-white">
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
                <SelectTrigger className="w-[65px] h-8 text-sm !border !border-black dark:!border-white bg-zinc-100 dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!border !border-black dark:!border-white">
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
