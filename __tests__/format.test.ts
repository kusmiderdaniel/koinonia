import { describe, it, expect } from 'vitest'
import {
  getTimeFormatPattern,
  getDateTimeFormatPattern,
  parseDuration,
  formatDuration,
  formatDurationMinutes,
  formatTime,
  formatTimeFromDate,
  formatSecondsToMinutes,
  formatRunningTime,
  formatDurationInputs,
  formatEventDateTime,
  formatEventCardDate,
  toDateString,
  parseDateString,
  formatDateRange,
} from '@/lib/utils/format'

describe('format utilities', () => {
  describe('getTimeFormatPattern', () => {
    it('should return 12h pattern for 12h format', () => {
      expect(getTimeFormatPattern('12h')).toBe('h:mm a')
    })

    it('should return 24h pattern for 24h format', () => {
      expect(getTimeFormatPattern('24h')).toBe('HH:mm')
    })
  })

  describe('getDateTimeFormatPattern', () => {
    it('should return 12h datetime pattern', () => {
      expect(getDateTimeFormatPattern('12h')).toBe("EEE, MMM d 'at' h:mm a")
    })

    it('should return 24h datetime pattern', () => {
      expect(getDateTimeFormatPattern('24h')).toBe("EEE, MMM d 'at' HH:mm")
    })
  })

  describe('parseDuration', () => {
    it('should parse valid MM:SS format', () => {
      expect(parseDuration('3:45')).toBe(225)
      expect(parseDuration('0:30')).toBe(30)
      expect(parseDuration('10:00')).toBe(600)
    })

    it('should return null for invalid formats', () => {
      expect(parseDuration('invalid')).toBeNull()
      expect(parseDuration('3:60')).toBeNull() // 60 seconds is invalid
      expect(parseDuration('3:5')).toBeNull() // needs 2 digit seconds
      expect(parseDuration('')).toBeNull()
    })
  })

  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(225)).toBe('3:45')
      expect(formatDuration(30)).toBe('0:30')
      expect(formatDuration(600)).toBe('10:00')
    })

    it('should format hours for 60+ minutes', () => {
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(3661)).toBe('1:01:01')
      expect(formatDuration(5400)).toBe('1:30:00')
    })

    it('should return empty string for null/undefined', () => {
      expect(formatDuration(null)).toBe('')
      expect(formatDuration(undefined)).toBe('')
    })
  })

  describe('formatDurationMinutes', () => {
    it('should format minutes under 60', () => {
      expect(formatDurationMinutes(30)).toBe('30m')
      expect(formatDurationMinutes(45)).toBe('45m')
    })

    it('should format hours for 60+ minutes', () => {
      expect(formatDurationMinutes(60)).toBe('1h')
      expect(formatDurationMinutes(90)).toBe('1h 30m')
      expect(formatDurationMinutes(120)).toBe('2h')
      expect(formatDurationMinutes(150)).toBe('2h 30m')
    })
  })

  describe('formatTime', () => {
    it('should format time in 12h format', () => {
      expect(formatTime('14:30:00', '12h')).toBe('2:30 PM')
      expect(formatTime('09:15', '12h')).toBe('9:15 AM')
      expect(formatTime('00:00', '12h')).toBe('12:00 AM')
      expect(formatTime('12:00', '12h')).toBe('12:00 PM')
    })

    it('should format time in 24h format', () => {
      expect(formatTime('14:30:00', '24h')).toBe('14:30')
      expect(formatTime('09:15', '24h')).toBe('09:15')
      expect(formatTime('00:00', '24h')).toBe('00:00')
    })

    it('should default to 24h format', () => {
      expect(formatTime('14:30:00')).toBe('14:30')
    })
  })

  describe('formatTimeFromDate', () => {
    it('should format Date in 12h format', () => {
      const date = new Date(2025, 11, 25, 14, 30, 0)
      const result = formatTimeFromDate(date, '12h')
      expect(result).toMatch(/2:30.*PM/)
    })

    it('should format Date in 24h format', () => {
      const date = new Date(2025, 11, 25, 14, 30, 0)
      const result = formatTimeFromDate(date, '24h')
      expect(result).toMatch(/14:30/)
    })

    it('should default to 24h format', () => {
      const date = new Date(2025, 11, 25, 9, 15, 0)
      const result = formatTimeFromDate(date)
      expect(result).toMatch(/9:15|09:15/)
    })
  })

  describe('formatSecondsToMinutes', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatSecondsToMinutes(90)).toBe('1:30')
      expect(formatSecondsToMinutes(0)).toBe('0:00')
      expect(formatSecondsToMinutes(59)).toBe('0:59')
      expect(formatSecondsToMinutes(125)).toBe('2:05')
    })
  })

  describe('formatRunningTime', () => {
    it('should format minutes only when under 1 hour', () => {
      expect(formatRunningTime(1800)).toBe('30m')
      expect(formatRunningTime(2700)).toBe('45m')
    })

    it('should format hours and minutes when over 1 hour', () => {
      expect(formatRunningTime(3600)).toBe('1h 0m')
      expect(formatRunningTime(5400)).toBe('1h 30m')
      expect(formatRunningTime(7200)).toBe('2h 0m')
    })
  })

  describe('formatDurationInputs', () => {
    it('should return minutes and seconds strings', () => {
      expect(formatDurationInputs(90)).toEqual({ minutes: '1', seconds: '30' })
      expect(formatDurationInputs(0)).toEqual({ minutes: '0', seconds: '00' })
      expect(formatDurationInputs(65)).toEqual({ minutes: '1', seconds: '05' })
    })
  })

  describe('formatEventDateTime', () => {
    it('should format all-day events', () => {
      const result = formatEventDateTime(
        '2025-12-25T00:00:00',
        '2025-12-25T23:59:59',
        true
      )
      expect(result.date).toBe('25/12/2025')
      expect(result.time).toBe('All day')
    })

    it('should format timed events in 24h format', () => {
      const result = formatEventDateTime(
        '2025-12-25T14:30:00',
        '2025-12-25T16:00:00',
        false,
        '24h'
      )
      expect(result.date).toBe('25/12/2025')
      expect(result.time).toMatch(/14:30.*16:00/)
    })

    it('should format timed events in 12h format', () => {
      const result = formatEventDateTime(
        '2025-12-25T14:30:00',
        '2025-12-25T16:00:00',
        false,
        '12h'
      )
      expect(result.date).toBe('25/12/2025')
      expect(result.time).toMatch(/2:30.*PM.*4:00.*PM/)
    })

    it('should default to 24h format', () => {
      const result = formatEventDateTime(
        '2025-12-25T09:00:00',
        '2025-12-25T10:30:00',
        false
      )
      expect(result.time).toMatch(/9:00.*10:30|09:00.*10:30/)
    })
  })

  describe('formatEventCardDate', () => {
    it('should format all-day events', () => {
      const result = formatEventCardDate('2025-12-25T00:00:00', true)
      expect(result.date).toMatch(/Thu.*Dec.*25/)
      expect(result.time).toBe('All day')
    })

    it('should format timed events in 24h format', () => {
      const result = formatEventCardDate('2025-12-25T14:30:00', false, '24h')
      expect(result.date).toMatch(/Thu.*Dec.*25/)
      expect(result.time).toMatch(/14:30/)
    })

    it('should format timed events in 12h format', () => {
      const result = formatEventCardDate('2025-12-25T14:30:00', false, '12h')
      expect(result.date).toMatch(/Thu.*Dec.*25/)
      expect(result.time).toMatch(/2:30.*PM/)
    })

    it('should default to 24h format', () => {
      const result = formatEventCardDate('2025-12-25T09:15:00', false)
      expect(result.time).toMatch(/9:15|09:15/)
    })
  })

  describe('toDateString', () => {
    it('should convert Date to YYYY-MM-DD string', () => {
      expect(toDateString(new Date(2025, 11, 25))).toBe('2025-12-25')
      expect(toDateString(new Date(2025, 0, 1))).toBe('2025-01-01')
      expect(toDateString(new Date(2025, 5, 15))).toBe('2025-06-15')
    })
  })

  describe('parseDateString', () => {
    it('should parse YYYY-MM-DD string to Date', () => {
      const date = parseDateString('2025-12-25')
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(11) // December is 11
      expect(date.getDate()).toBe(25)
    })
  })

  describe('formatDateRange', () => {
    it('should format single day', () => {
      expect(formatDateRange('2025-12-25', '2025-12-25')).toBe('Dec 25')
    })

    it('should format date range', () => {
      expect(formatDateRange('2025-12-23', '2025-12-25')).toBe('Dec 23 - Dec 25')
    })

    it('should handle cross-month ranges', () => {
      expect(formatDateRange('2025-12-30', '2026-01-02')).toBe('Dec 30 - Jan 2')
    })
  })
})
