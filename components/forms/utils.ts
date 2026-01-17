import { optionColors } from '@/lib/validations/forms'

export function getOptionColorClasses(colorName: string | null | undefined) {
  if (!colorName) {
    return { bg: '!bg-zinc-200 dark:!bg-zinc-700', text: '!text-zinc-800 dark:!text-zinc-100' }
  }
  const color = optionColors.find((c) => c.name === colorName)
  return color || { bg: '!bg-zinc-200 dark:!bg-zinc-700', text: '!text-zinc-800 dark:!text-zinc-100' }
}
