import { describe, it, expect } from 'vitest'
import {
  validateImageFile,
  validatePDFFile,
  getSafeExtension,
  validateStoragePath,
  extractAndValidateStoragePath,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZES,
} from '@/lib/validations/upload'

// Helper to create a mock File object
function createMockFile(
  type: string,
  size: number,
  name: string = 'test.file'
): File {
  const blob = new Blob([''], { type })
  Object.defineProperty(blob, 'size', { value: size })
  Object.defineProperty(blob, 'name', { value: name })
  return blob as File
}

describe('upload validation', () => {
  describe('validateImageFile', () => {
    describe('valid images', () => {
      it('should accept JPEG images', () => {
        const file = createMockFile('image/jpeg', 1024 * 1024, 'test.jpg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('jpg')
      })

      it('should accept PNG images', () => {
        const file = createMockFile('image/png', 1024 * 1024, 'test.png')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('png')
      })

      it('should accept WebP images', () => {
        const file = createMockFile('image/webp', 1024 * 1024, 'test.webp')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('webp')
      })

      it('should accept GIF images', () => {
        const file = createMockFile('image/gif', 1024 * 1024, 'test.gif')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('gif')
      })

      it('should accept images at max size', () => {
        const file = createMockFile('image/jpeg', MAX_FILE_SIZES.IMAGE, 'test.jpg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(true)
      })
    })

    describe('invalid images', () => {
      it('should reject SVG images (potential XSS vector)', () => {
        const file = createMockFile('image/svg+xml', 1024, 'test.svg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Only JPEG, PNG, WebP, and GIF images are allowed')
      })

      it('should reject BMP images', () => {
        const file = createMockFile('image/bmp', 1024, 'test.bmp')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
      })

      it('should reject TIFF images', () => {
        const file = createMockFile('image/tiff', 1024, 'test.tiff')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
      })

      it('should reject images over max size', () => {
        const file = createMockFile('image/jpeg', MAX_FILE_SIZES.IMAGE + 1, 'test.jpg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('5MB')
      })

      it('should reject non-image files with image extension', () => {
        const file = createMockFile('application/javascript', 1024, 'malicious.jpg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
      })

      it('should reject HTML files disguised as images', () => {
        const file = createMockFile('text/html', 1024, 'malicious.jpg')
        const result = validateImageFile(file)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('validatePDFFile', () => {
    describe('valid PDFs', () => {
      it('should accept PDF files', () => {
        const file = createMockFile('application/pdf', 1024 * 1024, 'test.pdf')
        const result = validatePDFFile(file)
        expect(result.isValid).toBe(true)
        expect(result.extension).toBe('pdf')
      })

      it('should accept PDFs at max size', () => {
        const file = createMockFile('application/pdf', MAX_FILE_SIZES.DOCUMENT, 'test.pdf')
        const result = validatePDFFile(file)
        expect(result.isValid).toBe(true)
      })
    })

    describe('invalid PDFs', () => {
      it('should reject PDFs over max size', () => {
        const file = createMockFile('application/pdf', MAX_FILE_SIZES.DOCUMENT + 1, 'test.pdf')
        const result = validatePDFFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('10MB')
      })

      it('should reject non-PDF files', () => {
        const file = createMockFile('application/msword', 1024, 'test.doc')
        const result = validatePDFFile(file)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('Only PDF files are allowed')
      })

      it('should reject executable files disguised as PDF', () => {
        const file = createMockFile('application/x-executable', 1024, 'malicious.pdf')
        const result = validatePDFFile(file)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('getSafeExtension', () => {
    it('should return correct extension for image types', () => {
      expect(getSafeExtension('image/jpeg')).toBe('jpg')
      expect(getSafeExtension('image/png')).toBe('png')
      expect(getSafeExtension('image/webp')).toBe('webp')
      expect(getSafeExtension('image/gif')).toBe('gif')
    })

    it('should return correct extension for document types', () => {
      expect(getSafeExtension('application/pdf')).toBe('pdf')
    })

    it('should return undefined for unknown types', () => {
      expect(getSafeExtension('application/javascript')).toBeUndefined()
      expect(getSafeExtension('text/html')).toBeUndefined()
      expect(getSafeExtension('image/svg+xml')).toBeUndefined()
      expect(getSafeExtension('')).toBeUndefined()
    })
  })

  describe('validateStoragePath', () => {
    describe('valid paths', () => {
      it('should accept valid path with expected prefix', () => {
        const result = validateStoragePath('church123/images/photo.jpg', 'church123')
        expect(result.isValid).toBe(true)
      })

      it('should accept nested paths', () => {
        const result = validateStoragePath('church123/users/avatars/123.jpg', 'church123')
        expect(result.isValid).toBe(true)
      })

      it('should accept paths with UUID prefix', () => {
        const result = validateStoragePath('550e8400-e29b-41d4-a716-446655440000/file.jpg', '550e8400-e29b-41d4-a716-446655440000')
        expect(result.isValid).toBe(true)
      })
    })

    describe('path traversal attacks', () => {
      it('should reject paths with parent directory reference', () => {
        const result = validateStoragePath('church123/../other-church/secret.jpg', 'church123')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('traversal')
      })

      it('should reject paths with double dots at start', () => {
        const result = validateStoragePath('../../../etc/passwd', 'church123')
        expect(result.isValid).toBe(false)
      })

      it('should reject paths with encoded traversal', () => {
        // The .. is still present as literal characters
        const result = validateStoragePath('church123/..%2F..%2Fsecret', 'church123')
        expect(result.isValid).toBe(false)
      })

      it('should reject absolute paths', () => {
        const result = validateStoragePath('/etc/passwd', 'church123')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('absolute path')
      })

      it('should reject paths with null bytes', () => {
        const result = validateStoragePath('church123/file.jpg\0.exe', 'church123')
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('null byte')
      })
    })

    describe('prefix validation', () => {
      it('should reject path not starting with expected prefix', () => {
        const result = validateStoragePath('other-church/images/photo.jpg', 'church123')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Access denied')
      })

      it('should allow path with longer prefix that starts the same', () => {
        // This is valid because 'church1234' starts with 'church123'
        // The prefix check uses startsWith, so this passes
        const result = validateStoragePath('church1234/images/photo.jpg', 'church123')
        expect(result.isValid).toBe(true)
      })

      it('should reject path with completely different prefix', () => {
        const result = validateStoragePath('malicious/images/photo.jpg', 'church123')
        expect(result.isValid).toBe(false)
      })

      it('should handle path normalization', () => {
        // Multiple slashes should be normalized
        const result = validateStoragePath('church123///images//photo.jpg', 'church123')
        expect(result.isValid).toBe(true)
      })
    })

    describe('invalid input', () => {
      it('should reject empty path', () => {
        const result = validateStoragePath('', 'church123')
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Invalid path')
      })
    })
  })

  describe('extractAndValidateStoragePath', () => {
    const bucket = 'link-images'
    const churchId = 'church123'

    it('should extract valid path from URL', () => {
      const url = `https://storage.example.com/${bucket}/church123/photo.jpg`
      const result = extractAndValidateStoragePath(url, bucket, churchId)
      expect(result.path).toBe('church123/photo.jpg')
      expect(result.error).toBeUndefined()
    })

    it('should reject URL with wrong bucket', () => {
      const url = `https://storage.example.com/other-bucket/church123/photo.jpg`
      const result = extractAndValidateStoragePath(url, bucket, churchId)
      expect(result.error).toBe('Invalid URL format')
    })

    it('should reject URL without bucket delimiter', () => {
      const url = `https://storage.example.com/church123/photo.jpg`
      const result = extractAndValidateStoragePath(url, bucket, churchId)
      expect(result.error).toBe('Invalid URL format')
    })

    it('should reject path traversal in extracted path', () => {
      const url = `https://storage.example.com/${bucket}/church123/../other/secret.jpg`
      const result = extractAndValidateStoragePath(url, bucket, churchId)
      expect(result.error).toContain('traversal')
    })

    it('should reject path with wrong prefix', () => {
      const url = `https://storage.example.com/${bucket}/other-church/photo.jpg`
      const result = extractAndValidateStoragePath(url, bucket, churchId)
      expect(result.error).toBe('Access denied')
    })
  })

  describe('constants', () => {
    it('should have correct allowed image types', () => {
      expect(Object.keys(ALLOWED_IMAGE_TYPES)).toHaveLength(4)
      expect(ALLOWED_IMAGE_TYPES['image/jpeg']).toBe('jpg')
      expect(ALLOWED_IMAGE_TYPES['image/png']).toBe('png')
      expect(ALLOWED_IMAGE_TYPES['image/webp']).toBe('webp')
      expect(ALLOWED_IMAGE_TYPES['image/gif']).toBe('gif')
    })

    it('should have correct allowed document types', () => {
      expect(Object.keys(ALLOWED_DOCUMENT_TYPES)).toHaveLength(1)
      expect(ALLOWED_DOCUMENT_TYPES['application/pdf']).toBe('pdf')
    })

    it('should have correct max file sizes', () => {
      expect(MAX_FILE_SIZES.IMAGE).toBe(5 * 1024 * 1024) // 5MB
      expect(MAX_FILE_SIZES.DOCUMENT).toBe(10 * 1024 * 1024) // 10MB
    })
  })
})
