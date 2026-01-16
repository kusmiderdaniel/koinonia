import { describe, it, expect } from 'vitest'
import {
  validateToken,
  isValidToken,
  TOKEN_VALIDATION,
} from '@/lib/validations/token'

describe('token validation', () => {
  describe('validateToken', () => {
    describe('valid tokens', () => {
      it('should accept a 32-character nanoid token', () => {
        const token = 'V1StGXR8_Z5jdHi6B-myT_abc123def4'  // exactly 32 chars
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should accept a 43-character base64url token', () => {
        const token = 'V1StGXR8_Z5jdHi6B-myT_V1StGXR8_Z5jdHi6B-my'
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it('should accept tokens at minimum length', () => {
        const token = 'a'.repeat(TOKEN_VALIDATION.MIN_LENGTH)
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
      })

      it('should accept tokens at maximum length', () => {
        const token = 'a'.repeat(TOKEN_VALIDATION.MAX_LENGTH)
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
      })

      it('should accept tokens with underscores and hyphens', () => {
        const token = 'ABC_def-123_456-789_0ab-cde_fgh12345'  // 36 chars
        const result = validateToken(token)
        expect(result.isValid).toBe(true)
      })
    })

    describe('invalid tokens', () => {
      it('should reject null token', () => {
        const result = validateToken(null)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token is required')
      })

      it('should reject undefined token', () => {
        const result = validateToken(undefined)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token is required')
      })

      it('should reject empty string', () => {
        const result = validateToken('')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token is required')
      })

      it('should reject token that is too short', () => {
        const token = 'a'.repeat(TOKEN_VALIDATION.MIN_LENGTH - 1)
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token is too short')
      })

      it('should reject token that is too long', () => {
        const token = 'a'.repeat(TOKEN_VALIDATION.MAX_LENGTH + 1)
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token is too long')
      })

      it('should reject tokens with spaces', () => {
        // Token must be 32+ chars to get past length check, so we make it long enough
        const token = 'V1StGXR8 Z5jdHi6B myT abc123def456'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token contains invalid characters')
      })

      it('should reject tokens with special characters', () => {
        const token = 'V1StGXR8!Z5jdHi6B@myT#abc123def45'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token contains invalid characters')
      })

      it('should reject tokens with dots', () => {
        const token = 'V1StGXR8.Z5jdHi6B.myT.abc123def45'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token contains invalid characters')
      })

      it('should reject tokens with plus sign', () => {
        const token = 'V1StGXR8+Z5jdHi6B+myT+abc123def45'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token contains invalid characters')
      })

      it('should reject tokens with slash', () => {
        const token = 'V1StGXR8a1234567890a1234567890123'
        // Use a valid-length token but with a slash
        const tokenWithSlash = 'V1StGXR8/Z5jdHi6B/myT/abc123def45'
        const result = validateToken(tokenWithSlash)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Token contains invalid characters')
      })
    })

    describe('security edge cases', () => {
      it('should reject SQL injection attempts', () => {
        const token = "1' OR '1'='1'; DROP TABLE forms;--"
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
      })

      it('should reject path traversal attempts', () => {
        const token = '../../../etc/passwd__________'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
      })

      it('should reject script injection attempts', () => {
        const token = '<script>alert(1)</script>____'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
      })

      it('should reject tokens with unicode characters', () => {
        const token = 'V1StGXR8_Z5jdHi6B-myT_\u0000\u0001\u0002'
        const result = validateToken(token)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('isValidToken', () => {
    it('should return true for valid tokens', () => {
      // Must be at least 32 characters
      const token = 'V1StGXR8_Z5jdHi6B-myT_abc123def45'
      expect(isValidToken(token)).toBe(true)
    })

    it('should return false for invalid tokens', () => {
      expect(isValidToken(null)).toBe(false)
      expect(isValidToken(undefined)).toBe(false)
      expect(isValidToken('')).toBe(false)
      expect(isValidToken('short')).toBe(false)
    })

    it('should act as a type guard', () => {
      const maybeToken: string | null = 'V1StGXR8_Z5jdHi6B-myT_abc123def45'
      if (isValidToken(maybeToken)) {
        // TypeScript should know maybeToken is string here
        expect(maybeToken.length).toBeGreaterThan(0)
      }
    })
  })

  describe('TOKEN_VALIDATION constants', () => {
    it('should have correct MIN_LENGTH', () => {
      expect(TOKEN_VALIDATION.MIN_LENGTH).toBe(32)
    })

    it('should have correct MAX_LENGTH', () => {
      expect(TOKEN_VALIDATION.MAX_LENGTH).toBe(64)
    })

    it('should have correct PATTERN', () => {
      expect(TOKEN_VALIDATION.PATTERN).toBeInstanceOf(RegExp)
      expect(TOKEN_VALIDATION.PATTERN.test('ABC123_def-456')).toBe(true)
      expect(TOKEN_VALIDATION.PATTERN.test('invalid!char')).toBe(false)
    })
  })
})
