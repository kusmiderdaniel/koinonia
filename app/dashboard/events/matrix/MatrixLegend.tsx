'use client'

export function MatrixLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 border-t bg-white dark:bg-zinc-950 text-xs">
      <span className="text-muted-foreground font-medium">Legend:</span>

      {/* Song */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800" />
        <span className="text-muted-foreground">Song</span>
      </div>

      {/* Song placeholder */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-dashed border-amber-300 dark:border-amber-700" />
        <span className="text-muted-foreground">Placeholder</span>
      </div>

      {/* Agenda item with leader */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" />
        <span className="text-muted-foreground">Item (led by)</span>
      </div>

      {/* Agenda item needs leader */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700" />
        <span className="text-muted-foreground">Needs leader</span>
      </div>

      {/* Position assigned */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" />
        <span className="text-muted-foreground">Position filled</span>
      </div>

      {/* Unavailable */}
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px]">
          Name
        </span>
        <span className="text-muted-foreground">Unavailable</span>
      </div>

      {/* Multi-assigned */}
      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px]">
          Name
        </span>
        <span className="text-muted-foreground">Multiple roles</span>
      </div>
    </div>
  )
}
