import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '..', 'public', 'icons')
const screenshotsDir = join(__dirname, '..', 'public', 'screenshots')

// Ensure directories exist
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true })
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

async function generateIcons() {
  console.log('Generating PWA icons...')

  // Read the SVG files
  const svgPath = join(iconsDir, 'icon.svg')
  const maskableSvgPath = join(iconsDir, 'icon-maskable.svg')
  const svgBuffer = readFileSync(svgPath)
  const maskableSvgBuffer = readFileSync(maskableSvgPath)

  // Generate standard icons
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`  Created: icon-${size}x${size}.png`)
  }

  // Generate maskable icons
  for (const size of maskableSizes) {
    const outputPath = join(iconsDir, `icon-maskable-${size}x${size}.png`)
    await sharp(maskableSvgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`  Created: icon-maskable-${size}x${size}.png`)
  }

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(iconsDir, 'favicon-32x32.png'))
  console.log('  Created: favicon-32x32.png')

  console.log('\nGenerating placeholder screenshots...')

  // Create placeholder desktop screenshot (1280x720)
  const desktopSvg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#f5f5f5"/>
      <rect x="0" y="0" width="240" height="720" fill="#ffffff"/>
      <rect x="240" y="0" width="1040" height="64" fill="#f49f1e"/>
      <text x="640" y="360" font-family="Arial" font-size="32" fill="#666" text-anchor="middle">Koinonia Dashboard</text>
      <text x="640" y="400" font-family="Arial" font-size="16" fill="#999" text-anchor="middle">Church management platform</text>
    </svg>
  `
  await sharp(Buffer.from(desktopSvg))
    .png()
    .toFile(join(screenshotsDir, 'desktop.png'))
  console.log('  Created: screenshots/desktop.png')

  // Create placeholder mobile screenshot (750x1334)
  const mobileSvg = `
    <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
      <rect width="750" height="1334" fill="#f5f5f5"/>
      <rect x="0" y="0" width="750" height="80" fill="#f49f1e"/>
      <text x="375" y="667" font-family="Arial" font-size="32" fill="#666" text-anchor="middle">Koinonia</text>
      <text x="375" y="707" font-family="Arial" font-size="16" fill="#999" text-anchor="middle">Church management platform</text>
    </svg>
  `
  await sharp(Buffer.from(mobileSvg))
    .png()
    .toFile(join(screenshotsDir, 'mobile.png'))
  console.log('  Created: screenshots/mobile.png')

  console.log('\nDone!')
}

generateIcons().catch(console.error)
