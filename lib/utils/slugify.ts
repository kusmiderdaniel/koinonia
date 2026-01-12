/**
 * Character mappings for transliteration.
 * Maps special characters (especially Polish) to their ASCII equivalents.
 */
const CHAR_MAP: Record<string, string> = {
  // Polish characters
  'ą': 'a',
  'ć': 'c',
  'ę': 'e',
  'ł': 'l',
  'ń': 'n',
  'ó': 'o',
  'ś': 's',
  'ź': 'z',
  'ż': 'z',
  'Ą': 'a',
  'Ć': 'c',
  'Ę': 'e',
  'Ł': 'l',
  'Ń': 'n',
  'Ó': 'o',
  'Ś': 's',
  'Ź': 'z',
  'Ż': 'z',
  // German characters
  'ä': 'ae',
  'ö': 'oe',
  'ü': 'ue',
  'ß': 'ss',
  'Ä': 'ae',
  'Ö': 'oe',
  'Ü': 'ue',
  // Other common characters
  'æ': 'ae',
  'œ': 'oe',
  'ø': 'o',
  'Æ': 'ae',
  'Œ': 'oe',
  'Ø': 'o',
}

/**
 * Transliterate special characters to ASCII equivalents.
 * Uses explicit character mapping for Polish and other special characters,
 * then NFD normalization for remaining accented characters.
 */
function transliterate(text: string): string {
  // First, replace characters from our explicit map
  let result = text
  for (const [char, replacement] of Object.entries(CHAR_MAP)) {
    result = result.replace(new RegExp(char, 'g'), replacement)
  }

  // Then use NFD normalization to handle remaining accented characters
  // This decomposes characters like "é" into "e" + combining accent mark
  // Then we remove the combining marks
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return result
}

/**
 * Generate a URL-safe slug from a string.
 * Handles Polish and other special characters properly.
 *
 * @param text - The text to slugify
 * @param maxLength - Maximum length of the slug (default: 30)
 * @returns URL-safe slug
 *
 * @example
 * slugify("Pełnia") // "pelnia"
 * slugify("Kościół Światłości") // "kosciol-swiatlosci"
 * slugify("Café München") // "cafe-muenchen"
 */
export function slugify(text: string, maxLength: number = 30): string {
  return transliterate(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    .substring(0, maxLength)
}
