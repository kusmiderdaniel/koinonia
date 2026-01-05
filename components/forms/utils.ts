import { optionColors } from '@/lib/validations/forms'

export function getOptionColorClasses(colorName: string | null | undefined) {
  if (!colorName) {
    return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
  }
  const color = optionColors.find((c) => c.name === colorName)
  return color || { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
}
