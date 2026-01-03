/**
 * Handle minutes input change - allows only digits up to 2 chars
 */
export function handleMinutesChange(
  value: string,
  setter: (value: string) => void
): void {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 2) {
    setter(cleaned)
  }
}

/**
 * Handle seconds input change - allows only digits up to 2 chars, max 59
 */
export function handleSecondsChange(
  value: string,
  setter: (value: string) => void
): void {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 2) {
    const num = parseInt(cleaned, 10)
    if (isNaN(num) || num < 60) {
      setter(cleaned)
    }
  }
}

/**
 * Parse duration from minutes and seconds inputs
 */
export function parseDuration(minutes: string, seconds: string): number {
  const mins = parseInt(minutes, 10) || 0
  const secs = parseInt(seconds, 10) || 0
  return mins * 60 + secs
}

/**
 * Format total seconds to minutes and seconds strings
 */
export function formatDurationInputs(totalSeconds: number): {
  minutes: string
  seconds: string
} {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return {
    minutes: mins.toString(),
    seconds: secs.toString().padStart(2, '0'),
  }
}
