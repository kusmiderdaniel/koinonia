/**
 * Legal Document PDF Generation
 *
 * Generates styled PDF documents with Koinonia branding for legal documents.
 * Used for email attachments when sending silent acceptance notifications.
 */

import jsPDF from 'jspdf'

// Brand color (orange) - #f49f1e converted to RGB
const BRAND_COLOR: [number, number, number] = [244, 159, 30]
const DARK_TEXT: [number, number, number] = [33, 33, 33]
const GRAY_TEXT: [number, number, number] = [107, 114, 128]
const LIGHT_GRAY: [number, number, number] = [229, 231, 235]

// Page dimensions and margins (A4)
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 20
const MARGIN_RIGHT = 20
const MARGIN_TOP = 25
const MARGIN_BOTTOM = 25
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

// Font sizes
const FONT_SIZE_TITLE = 20
const FONT_SIZE_HEADING = 14
const FONT_SIZE_SUBHEADING = 12
const FONT_SIZE_BODY = 10
const FONT_SIZE_FOOTER = 8

// Line heights
const LINE_HEIGHT_BODY = 5
const LINE_HEIGHT_HEADING = 7

export interface GenerateLegalDocumentPDFOptions {
  title: string
  content: string // Markdown content
  version: number
  effectiveDate: string
  language: 'en' | 'pl'
}

interface TextBlock {
  type: 'heading' | 'subheading' | 'paragraph' | 'list-item' | 'spacer'
  text: string
  level?: number // For headings (1, 2, 3)
}

/**
 * Parse markdown content into structured text blocks
 */
function parseMarkdown(content: string): TextBlock[] {
  const lines = content.split('\n')
  const blocks: TextBlock[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      // Empty line - add spacer
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer', text: '' })
      }
      continue
    }

    // Check for headings
    if (line.startsWith('### ')) {
      blocks.push({ type: 'subheading', text: line.slice(4), level: 3 })
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'subheading', text: line.slice(3), level: 2 })
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', text: line.slice(2), level: 1 })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // List item
      blocks.push({ type: 'list-item', text: line.slice(2) })
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list item
      blocks.push({ type: 'list-item', text: line.replace(/^\d+\.\s/, '') })
    } else {
      // Regular paragraph
      blocks.push({ type: 'paragraph', text: line })
    }
  }

  return blocks
}

/**
 * Clean markdown formatting from text (bold, italic, links, etc.)
 */
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/__(.+?)__/g, '$1') // Bold alt
    .replace(/_(.+?)_/g, '$1') // Italic alt
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/{{(.+?)}}/g, '$1') // Template variables
    .replace(/<strong>(.+?)<\/strong>/g, '$1') // HTML bold
    .replace(/<em>(.+?)<\/em>/g, '$1') // HTML italic
    .replace(/<[^>]+>/g, '') // Any other HTML tags
}

/**
 * Generate a styled PDF document for legal documents
 */
export async function generateLegalDocumentPDF(
  options: GenerateLegalDocumentPDFOptions
): Promise<Buffer> {
  const { title, content, version, effectiveDate, language } = options

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let currentY = MARGIN_TOP
  let pageNumber = 1

  // Translations
  const translations = {
    en: {
      version: 'Version',
      effectiveDate: 'Effective Date',
      page: 'Page',
      of: 'of',
      generated: 'Generated',
      legalDocument: 'Legal Document',
    },
    pl: {
      version: 'Wersja',
      effectiveDate: 'Data wejścia w życie',
      page: 'Strona',
      of: 'z',
      generated: 'Wygenerowano',
      legalDocument: 'Dokument prawny',
    },
  }
  const t = translations[language]

  /**
   * Add header to page
   */
  function addHeader(): void {
    // Brand color bar at top
    doc.setFillColor(...BRAND_COLOR)
    doc.rect(0, 0, PAGE_WIDTH, 3, 'F')

    // Koinonia text as logo (since we can't easily embed the actual logo)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...BRAND_COLOR)
    doc.text('KOINONIA', MARGIN_LEFT, 12)

    // Legal document badge
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_TEXT)
    doc.text(t.legalDocument.toUpperCase(), MARGIN_LEFT, 17)

    // Version and date on the right
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONT_SIZE_FOOTER)
    doc.setTextColor(...GRAY_TEXT)
    const versionText = `${t.version} ${version}`
    const dateText = `${t.effectiveDate}: ${effectiveDate}`
    doc.text(versionText, PAGE_WIDTH - MARGIN_RIGHT, 12, { align: 'right' })
    doc.text(dateText, PAGE_WIDTH - MARGIN_RIGHT, 17, { align: 'right' })

    // Separator line
    doc.setDrawColor(...LIGHT_GRAY)
    doc.setLineWidth(0.5)
    doc.line(MARGIN_LEFT, 22, PAGE_WIDTH - MARGIN_RIGHT, 22)

    currentY = MARGIN_TOP
  }

  /**
   * Add footer to page
   */
  function addFooter(totalPages?: number): void {
    // Footer line
    doc.setDrawColor(...LIGHT_GRAY)
    doc.setLineWidth(0.5)
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 15)

    // Page number
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONT_SIZE_FOOTER)
    doc.setTextColor(...GRAY_TEXT)
    const pageText = totalPages
      ? `${t.page} ${pageNumber} ${t.of} ${totalPages}`
      : `${t.page} ${pageNumber}`
    doc.text(pageText, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' })

    // Generation date on left
    const generatedDate = new Date().toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')
    doc.text(`${t.generated}: ${generatedDate}`, MARGIN_LEFT, PAGE_HEIGHT - 10)

    // Koinonia on right
    doc.setTextColor(...BRAND_COLOR)
    doc.text('koinonia.app', PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10, { align: 'right' })
  }

  /**
   * Check if we need a new page
   */
  function checkNewPage(neededHeight: number): void {
    if (currentY + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      addFooter()
      doc.addPage()
      pageNumber++
      addHeader()
    }
  }

  /**
   * Add wrapped text with word wrapping
   */
  function addWrappedText(
    text: string,
    fontSize: number,
    lineHeight: number,
    fontStyle: 'normal' | 'bold' = 'normal',
    indent: number = 0
  ): void {
    doc.setFont('helvetica', fontStyle)
    doc.setFontSize(fontSize)
    doc.setTextColor(...DARK_TEXT)

    const cleanedText = cleanMarkdownFormatting(text)
    const availableWidth = CONTENT_WIDTH - indent
    const lines = doc.splitTextToSize(cleanedText, availableWidth)

    for (const line of lines) {
      checkNewPage(lineHeight)
      doc.text(line, MARGIN_LEFT + indent, currentY)
      currentY += lineHeight
    }
  }

  // Start generating PDF
  addHeader()

  // Document title
  currentY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_TITLE)
  doc.setTextColor(...DARK_TEXT)

  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH)
  for (const line of titleLines) {
    doc.text(line, MARGIN_LEFT, currentY)
    currentY += 8
  }

  currentY += 5

  // Brand color accent line under title
  doc.setFillColor(...BRAND_COLOR)
  doc.rect(MARGIN_LEFT, currentY, 40, 1, 'F')
  currentY += 10

  // Parse and render content
  const blocks = parseMarkdown(content)

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        checkNewPage(LINE_HEIGHT_HEADING * 2)
        currentY += 4
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(FONT_SIZE_HEADING)
        doc.setTextColor(...DARK_TEXT)
        const headingLines = doc.splitTextToSize(cleanMarkdownFormatting(block.text), CONTENT_WIDTH)
        for (const line of headingLines) {
          doc.text(line, MARGIN_LEFT, currentY)
          currentY += LINE_HEIGHT_HEADING
        }
        currentY += 2
        break

      case 'subheading':
        checkNewPage(LINE_HEIGHT_HEADING * 2)
        currentY += 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(block.level === 2 ? FONT_SIZE_SUBHEADING : FONT_SIZE_BODY + 1)
        doc.setTextColor(...DARK_TEXT)
        const subheadingLines = doc.splitTextToSize(
          cleanMarkdownFormatting(block.text),
          CONTENT_WIDTH
        )
        for (const line of subheadingLines) {
          doc.text(line, MARGIN_LEFT, currentY)
          currentY += LINE_HEIGHT_BODY + 1
        }
        currentY += 1
        break

      case 'paragraph':
        addWrappedText(block.text, FONT_SIZE_BODY, LINE_HEIGHT_BODY)
        break

      case 'list-item':
        // Add bullet point
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(FONT_SIZE_BODY)
        doc.text('•', MARGIN_LEFT + 2, currentY)
        // Add text with indent
        addWrappedText(block.text, FONT_SIZE_BODY, LINE_HEIGHT_BODY, 'normal', 8)
        break

      case 'spacer':
        currentY += 3
        break
    }
  }

  // Add final footer with total pages
  addFooter(pageNumber)

  // If we have multiple pages, go back and update footers
  if (pageNumber > 1) {
    for (let i = 1; i <= pageNumber; i++) {
      doc.setPage(i)
      // Clear old footer area
      doc.setFillColor(255, 255, 255)
      doc.rect(0, PAGE_HEIGHT - 20, PAGE_WIDTH, 20, 'F')
      // Re-add footer with total
      pageNumber = i
      addFooter(doc.getNumberOfPages())
    }
  }

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

/**
 * Get document type display name
 */
export function getDocumentTypeLabel(
  documentType: string,
  language: 'en' | 'pl'
): string {
  const labels: Record<string, Record<'en' | 'pl', string>> = {
    terms_of_service: {
      en: 'Terms of Service',
      pl: 'Regulamin',
    },
    privacy_policy: {
      en: 'Privacy Policy',
      pl: 'Polityka prywatności',
    },
    dpa: {
      en: 'Data Processing Agreement',
      pl: 'Umowa powierzenia przetwarzania danych',
    },
    church_admin_terms: {
      en: 'Church Administrator Terms',
      pl: 'Regulamin administratora kościoła',
    },
  }

  return labels[documentType]?.[language] || documentType
}

/**
 * Generate PDF filename
 */
export function generatePDFFilename(
  documentType: string,
  version: number,
  language: 'en' | 'pl'
): string {
  const typeNames: Record<string, string> = {
    terms_of_service: 'Terms-of-Service',
    privacy_policy: 'Privacy-Policy',
    dpa: 'Data-Processing-Agreement',
    church_admin_terms: 'Church-Admin-Terms',
  }

  const typeName = typeNames[documentType] || documentType
  return `Koinonia-${typeName}-v${version}-${language.toUpperCase()}.pdf`
}
