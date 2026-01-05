"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        month_caption: "flex justify-center relative items-center h-9",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between",
        weekday: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
        week: "flex justify-between mt-2",
        day: "text-center text-sm h-9 w-9 p-0 relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:rounded-md",
        day_button: "h-9 w-9 p-0 font-normal rounded-md transition-colors hover:!bg-zinc-200 dark:hover:!bg-zinc-700 cursor-pointer",
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "!bg-black !text-white hover:!bg-black hover:!text-white focus:!bg-black focus:!text-white dark:!bg-white dark:!text-black dark:hover:!bg-white dark:hover:!text-black rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <Icon className={cn("h-4 w-4", className)} {...props} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
