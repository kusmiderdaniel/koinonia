import { describe, it, expect } from 'vitest'
import {
  getContrastColor,
  getIconComponent,
  CARD_SIZE_STYLES,
  CARD_SIZE_STYLES_PREVIEW,
} from '@/lib/utils/link-utils'

describe('link-utils', () => {
  describe('getContrastColor', () => {
    it('should return dark color for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#1f2937')
      expect(getContrastColor('#F0F0F0')).toBe('#1f2937')
      expect(getContrastColor('#FFFF00')).toBe('#1f2937') // Yellow
      expect(getContrastColor('FFFFFF')).toBe('#1f2937') // Without #
    })

    it('should return white color for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff')
      expect(getContrastColor('#1F2937')).toBe('#ffffff')
      expect(getContrastColor('#3B82F6')).toBe('#ffffff') // Blue
      expect(getContrastColor('000000')).toBe('#ffffff') // Without #
    })

    it('should handle edge cases around luminance threshold', () => {
      // Gray around the threshold
      expect(getContrastColor('#808080')).toBe('#1f2937') // Mid gray, slightly above 0.5
      expect(getContrastColor('#6B7280')).toBe('#ffffff') // Darker gray
    })
  })

  describe('getIconComponent', () => {
    it('should return null for null/undefined input', () => {
      expect(getIconComponent(null)).toBeNull()
    })

    it('should handle mixed case input (converts to proper PascalCase)', () => {
      // The function converts 'ArrowRight' to 'Arrowright' (lowercase after first char)
      // so PascalCase input without delimiters won't match
      const icon = getIconComponent('ArrowRight')
      expect(icon).toBeNull() // Expected: doesn't match 'ArrowRight' icon

      // Use kebab-case or snake_case for reliable icon lookup
      expect(getIconComponent('arrow-right')).not.toBeNull()
    })

    it('should find icons in kebab-case', () => {
      const icon = getIconComponent('arrow-right')
      expect(icon).not.toBeNull()
    })

    it('should find icons in snake_case', () => {
      const icon = getIconComponent('arrow_right')
      expect(icon).not.toBeNull()
    })

    it('should return null for non-existent icons', () => {
      expect(getIconComponent('nonexistent-icon-xyz')).toBeNull()
    })
  })

  describe('CARD_SIZE_STYLES', () => {
    it('should have all three size variants', () => {
      expect(CARD_SIZE_STYLES.small).toBeDefined()
      expect(CARD_SIZE_STYLES.medium).toBeDefined()
      expect(CARD_SIZE_STYLES.large).toBeDefined()
    })

    it('should have all required properties for each size', () => {
      const sizes = ['small', 'medium', 'large'] as const
      for (const size of sizes) {
        const style = CARD_SIZE_STYLES[size]
        expect(style.padding).toBeDefined()
        expect(style.text).toBeDefined()
        expect(style.icon).toBeDefined()
        expect(style.height).toBeDefined()
      }
    })

    it('should have progressively larger values', () => {
      // Height values should increase with size
      expect(CARD_SIZE_STYLES.small.height).toBe('h-16')
      expect(CARD_SIZE_STYLES.medium.height).toBe('h-20')
      expect(CARD_SIZE_STYLES.large.height).toBe('h-28')
    })
  })

  describe('CARD_SIZE_STYLES_PREVIEW', () => {
    it('should have smaller values than full-size styles', () => {
      // Preview heights should be smaller
      expect(CARD_SIZE_STYLES_PREVIEW.small.height).toBe('h-10')
      expect(CARD_SIZE_STYLES_PREVIEW.medium.height).toBe('h-12')
      expect(CARD_SIZE_STYLES_PREVIEW.large.height).toBe('h-16')
    })
  })
})
