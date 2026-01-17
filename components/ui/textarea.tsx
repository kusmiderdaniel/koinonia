import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-black/20 dark:border-white/20 dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring-50 aria-invalid:ring-[color:oklch(0.58_0.22_27/20%)] dark:aria-invalid:ring-[color:oklch(0.704_0.191_22.216/40%)] aria-invalid:border-destructive dark:aria-invalid:border-destructive disabled:bg-input/50 dark:disabled:bg-input/80 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
