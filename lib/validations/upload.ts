/**
 * Upload validation utilities for secure file handling
 *
 * Security considerations:
 * - Never trust user-provided file extensions from filename
 * - Always derive extension from validated MIME type
 * - Validate both MIME type and file size before upload
 */

/**
 * Allowed image MIME types and their corresponding safe extensions
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const

/**
 * Allowed document MIME types and their corresponding safe extensions
 */
export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
} as const

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const

/**
 * Validates an image file and returns the safe extension
 *
 * @param file - The file to validate
 * @returns Object with isValid flag, extension, and optional error
 */
export function validateImageFile(file: File): {
  isValid: boolean
  extension?: string
  error?: string
} {
  // Validate MIME type
  const extension = ALLOWED_IMAGE_TYPES[file.type]
  if (!extension) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, WebP, and GIF images are allowed',
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZES.IMAGE) {
    return {
      isValid: false,
      error: 'Image size must be less than 5MB',
    }
  }

  return { isValid: true, extension }
}

/**
 * Validates a PDF file and returns the safe extension
 *
 * @param file - The file to validate
 * @returns Object with isValid flag, extension, and optional error
 */
export function validatePDFFile(file: File): {
  isValid: boolean
  extension?: string
  error?: string
} {
  // Validate MIME type
  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'Only PDF files are allowed',
    }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZES.DOCUMENT) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB',
    }
  }

  return { isValid: true, extension: 'pdf' }
}

/**
 * Gets a safe file extension from a validated MIME type
 * Returns undefined if the MIME type is not allowed
 *
 * @param mimeType - The MIME type to look up
 * @returns The safe extension or undefined
 */
export function getSafeExtension(mimeType: string): string | undefined {
  return ALLOWED_IMAGE_TYPES[mimeType] || ALLOWED_DOCUMENT_TYPES[mimeType]
}

/**
 * Validates a storage file path for security
 *
 * Prevents path traversal attacks by checking:
 * - No parent directory references (..)
 * - No absolute paths (starting with /)
 * - Path stays within the expected prefix after normalization
 *
 * @param filePath - The extracted file path
 * @param expectedPrefix - The prefix the path must start with (e.g., churchId)
 * @returns Object with isValid flag and optional error
 */
export function validateStoragePath(
  filePath: string,
  expectedPrefix: string
): { isValid: boolean; error?: string } {
  // Check for empty path
  if (!filePath || typeof filePath !== 'string') {
    return { isValid: false, error: 'Invalid path' }
  }

  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return { isValid: false, error: 'Invalid path: traversal detected' }
  }

  // Check for absolute paths
  if (filePath.startsWith('/')) {
    return { isValid: false, error: 'Invalid path: absolute path not allowed' }
  }

  // Check for null bytes (another traversal technique)
  if (filePath.includes('\0')) {
    return { isValid: false, error: 'Invalid path: null byte detected' }
  }

  // Normalize path and verify prefix
  const normalizedPath = filePath.split('/').filter(Boolean).join('/')
  if (!normalizedPath.startsWith(expectedPrefix)) {
    return { isValid: false, error: 'Access denied' }
  }

  return { isValid: true }
}

/**
 * Extracts and validates a file path from a storage URL
 *
 * @param url - The full URL to the stored file
 * @param bucket - The storage bucket name (e.g., 'link-images')
 * @param expectedPrefix - The prefix the path must start with (e.g., churchId)
 * @returns Object with the extracted path or an error
 */
export function extractAndValidateStoragePath(
  url: string,
  bucket: string,
  expectedPrefix: string
): { path?: string; error?: string } {
  const delimiter = `/${bucket}/`
  const parts = url.split(delimiter)

  if (parts.length !== 2) {
    return { error: 'Invalid URL format' }
  }

  const filePath = parts[1]
  const validation = validateStoragePath(filePath, expectedPrefix)

  if (!validation.isValid) {
    return { error: validation.error }
  }

  return { path: filePath }
}
