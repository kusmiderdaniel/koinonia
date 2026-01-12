import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType } from '@/app/dashboard/songs/types'

export interface ParsedSection {
  sectionType: SectionType
  sectionNumber: number
  label: string | null
  lyrics: string
}

// Map of common section header variations to their normalized type
const SECTION_TYPE_MAP: Record<string, SectionType> = {
  // Verse variations
  'verse': 'VERSE',
  'v': 'VERSE',
  // Chorus variations
  'chorus': 'CHORUS',
  'ch': 'CHORUS',
  'refrain': 'CHORUS',
  // Pre-chorus variations
  'pre-chorus': 'PRE_CHORUS',
  'prechorus': 'PRE_CHORUS',
  'pre chorus': 'PRE_CHORUS',
  'pre': 'PRE_CHORUS',
  // Bridge variations
  'bridge': 'BRIDGE',
  'br': 'BRIDGE',
  // Tag variations
  'tag': 'TAG',
  'coda': 'TAG',
  // Intro variations
  'intro': 'INTRO',
  'introduction': 'INTRO',
  // Outro variations
  'outro': 'OUTRO',
  'ending': 'ENDING',
  // Interlude variations
  'interlude': 'INTERLUDE',
  'instrumental': 'INTERLUDE',
  'inst': 'INTERLUDE',
  // Ending variations
  'end': 'ENDING',
}

/**
 * Checks if a header text matches a known section type
 */
function isKnownSectionType(headerText: string): boolean {
  const cleaned = headerText
    .replace(/\d+/g, '')
    .replace(/[:\-_]/g, ' ')
    .trim()
    .toLowerCase()

  if (SECTION_TYPE_MAP[cleaned]) {
    return true
  }

  // Also check direct type match
  const upperType = cleaned.toUpperCase().replace(/[\s\-]/g, '_') as SectionType
  return SECTION_TYPES.includes(upperType)
}

/**
 * Parses a section header and extracts the type and number
 * Supports formats like:
 * - [Verse 1], [CHORUS], [Pre-Chorus]
 * - VERSE 1:, CHORUS:, PRE-CHORUS:
 * - VERSE 1, CHORUS, BRIDGE (without colon, uppercase)
 * - Verse 1:, Chorus:, Bridge: (mixed case with colon)
 */
function parseHeader(header: string): { type: SectionType | null; number: number; label: string | null } {
  // Clean up the header
  const cleaned = header.trim()

  // Extract any number from the header
  const numberMatch = cleaned.match(/(\d+)/)
  const number = numberMatch ? parseInt(numberMatch[1], 10) : 1

  // Remove the number and any common separators to get the type
  const typeText = cleaned
    .replace(/\d+/g, '')
    .replace(/[:\-_]/g, ' ')
    .trim()
    .toLowerCase()

  // Look up the type in our map
  const sectionType = SECTION_TYPE_MAP[typeText]

  if (sectionType) {
    return { type: sectionType, number, label: null }
  }

  // If we can't identify the type, check if it's a valid type directly
  const upperType = typeText.toUpperCase().replace(/[\s\-]/g, '_') as SectionType
  if (SECTION_TYPES.includes(upperType)) {
    return { type: upperType, number, label: null }
  }

  // Unknown type - use as custom label, default to VERSE
  return { type: 'VERSE', number, label: cleaned }
}

/**
 * Parses raw lyrics text with section headers into structured sections
 *
 * Supported formats:
 * 1. Square brackets: [Verse 1], [Chorus], [Bridge]
 * 2. With colon: VERSE 1:, Chorus:, Bridge:
 * 3. Uppercase without colon: VERSE 1, CHORUS, BRIDGE
 *
 * @param text - The raw lyrics text to parse
 * @returns Array of parsed sections
 */
export function parseLyrics(text: string): ParsedSection[] {
  if (!text.trim()) {
    return []
  }

  const sections: ParsedSection[] = []

  // Split by lines and process
  const lines = text.split('\n')
  let currentSection: ParsedSection | null = null
  let currentLyrics: string[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Check if this line is a section header
    // Format 1: [Section Name]
    const bracketMatch = trimmedLine.match(/^\[([^\]]+)\]$/)
    // Format 2: SECTION NAME: or SECTION NAME (with optional colon)
    // Matches: "VERSE 1:", "VERSE 1", "Chorus:", "Chorus", "PRE-CHORUS 2:", etc.
    // Must be a known section type word (checked after matching)
    const colonMatch = trimmedLine.match(/^([A-Za-z][A-Za-z\s\d\-]*\d*):?$/)

    // For colon format, verify it looks like a section header (not just any text)
    // Either has a colon, or is all/mostly uppercase, or matches a known section type
    const isValidColonFormat = colonMatch && (
      trimmedLine.endsWith(':') ||
      trimmedLine === trimmedLine.toUpperCase() ||
      isKnownSectionType(colonMatch[1])
    )

    if (bracketMatch || isValidColonFormat) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.lyrics = currentLyrics.join('\n').trim()
        if (currentSection.lyrics) {
          sections.push(currentSection)
        }
      }

      // Parse the new header (strip trailing colon if present)
      const headerText = bracketMatch
        ? bracketMatch[1]
        : colonMatch![1].replace(/:$/, '')
      const { type, number, label } = parseHeader(headerText)

      currentSection = {
        sectionType: type || 'VERSE',
        sectionNumber: number,
        label,
        lyrics: '',
      }
      currentLyrics = []
    } else {
      // This is a lyrics line
      currentLyrics.push(line)
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.lyrics = currentLyrics.join('\n').trim()
    if (currentSection.lyrics) {
      sections.push(currentSection)
    }
  }

  // If no sections were found but there's text, create a single verse
  if (sections.length === 0 && text.trim()) {
    sections.push({
      sectionType: 'VERSE',
      sectionNumber: 1,
      label: null,
      lyrics: text.trim(),
    })
  }

  return sections
}

/**
 * Generates a display label for a section
 * e.g., "Verse 1", "Chorus", "Pre-Chorus 2"
 */
export function getSectionDisplayLabel(section: ParsedSection): string {
  if (section.label) {
    return section.label
  }

  const baseLabel = SECTION_TYPE_LABELS[section.sectionType]

  // Only show number for types that typically have multiple instances
  const typesWithNumbers: SectionType[] = ['VERSE', 'BRIDGE', 'INTERLUDE']

  if (typesWithNumbers.includes(section.sectionType) && section.sectionNumber > 0) {
    return `${baseLabel} ${section.sectionNumber}`
  }

  return baseLabel
}

/**
 * Formats sections back into text format with headers
 * Useful for previewing or exporting
 */
export function formatSectionsAsText(sections: ParsedSection[]): string {
  return sections
    .map((section) => {
      const label = getSectionDisplayLabel(section)
      return `[${label}]\n${section.lyrics}`
    })
    .join('\n\n')
}
