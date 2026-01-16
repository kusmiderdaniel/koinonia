/**
 * AES-256-GCM Encryption Module
 *
 * Used for encrypting sensitive data like OAuth tokens.
 * Format: iv:authTag:ciphertext (all hex encoded)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Get the encryption key from environment variables.
 * Key must be 64 hex characters (32 bytes).
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  // Validate that it's valid hex
  if (!/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must contain only hexadecimal characters')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a string using AES-256-GCM.
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (hex encoded)
 *
 * @example
 * const encrypted = encrypt('my-secret-token')
 * // Returns: "a1b2c3...:d4e5f6...:g7h8i9..."
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string that was encrypted with AES-256-GCM.
 *
 * @param encryptedText - The encrypted string in format: iv:authTag:ciphertext
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails (invalid format, wrong key, tampered data)
 *
 * @example
 * const decrypted = decrypt('a1b2c3...:d4e5f6...:g7h8i9...')
 * // Returns: "my-secret-token"
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()

  const parts = encryptedText.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected: iv:authTag:ciphertext')
  }

  const [ivHex, authTagHex, ciphertext] = parts

  // Validate hex lengths
  if (ivHex.length !== IV_LENGTH * 2) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH * 2} hex chars, got ${ivHex.length}`)
  }

  if (authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH * 2} hex chars, got ${authTagHex.length}`)
  }

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if the encryption key is properly configured.
 * Useful for startup validation.
 */
export function validateEncryptionConfig(): { valid: boolean; error?: string } {
  try {
    getEncryptionKey()
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate a new encryption key (for documentation purposes).
 * Run: openssl rand -hex 32
 *
 * This function is only for development/testing.
 * In production, generate the key externally and store securely.
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
