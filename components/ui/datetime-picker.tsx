"use client"

import * as React from "react"
import { format, parse, isValid, setHours, setMinutes } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: string // ISO datetime string or datetime-local format
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  label?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
  className,
  id,
  label,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse value to Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const date = new Date(value)
    return isValid(date) ? date : undefined
  }, [value])

  // Get time string from date
  const timeValue = React.useMemo(() => {
    if (!dateValue) return ""
    const hours = dateValue.getHours().toString().padStart(2, "0")
    const minutes = dateValue.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
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

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    if (time && dateValue) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = setMinutes(setHours(dateValue, hours), minutes)
      onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
    } else if (time && !dateValue) {
      // If no date selected, use today
      const today = new Date()
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = setMinutes(setHours(today, hours), minutes)
      onChange?.(format(newDate, "yyyy-MM-dd'T'HH:mm"))
    }
  }

  const displayValue = dateValue
    ? format(dateValue, "dd/MM/yyyy HH:mm")
    : placeholder

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
        className="w-auto p-2 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg"
        align="start"
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
            <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label || "Time"}</Label>
            <div className="relative flex-1">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="pl-7 h-8 text-sm !border !border-black dark:!border-white bg-zinc-100 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
