import QRCode from 'qrcode'
import { GamePhase, QRRarity } from './generated/prisma'

export interface QRMetadata {
  code: string
  name: string
  description?: string
  phase: GamePhase
  sequenceOrder: number
  rarity: QRRarity
  tokenReward: string
  hint?: {
    title: string
    content: string
  }
  // Additional metadata for verification
  timestamp: number
  version: string
}

export interface QRGenerationOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Creates a QR code data string with minimal essential metadata
 * Uses a simple format: TOKEN_CRUNCHIES://[code]:[phase]:[sequence]:[reward]
 */
export function createQRData(metadata: Omit<QRMetadata, 'timestamp' | 'version'>): string {
  // For better scannability, use minimal data format
  const minimalData = `${metadata.code}:${metadata.phase}:${metadata.sequenceOrder}:${metadata.tokenReward}:${metadata.rarity}`

  // If hint is provided, add it but keep it simple
  if (metadata.hint) {
    const hintText = metadata.hint.content.substring(0, 100) // Limit hint length
    return `TOKEN_CRUNCHIES://${minimalData}:${hintText.replace(/:/g, ';')}`
  }

  return `TOKEN_CRUNCHIES://${minimalData}`
}

/**
 * Extracts metadata from a QR code data string
 */
export function extractQRMetadata(qrData: string): QRMetadata | null {
  try {
    // Check if it's our custom format
    if (!qrData.startsWith('TOKEN_CRUNCHIES://')) {
      return null
    }

    // Extract data after protocol
    const dataPart = qrData.replace('TOKEN_CRUNCHIES://', '')
    const parts = dataPart.split(':')

    if (parts.length < 5) {
      throw new Error('Invalid QR data format')
    }

    // Parse the essential data
    const code = parts[0]
    const phase = parts[1] as 'PHASE_1' | 'PHASE_2' | 'PHASE_3'
    const sequenceOrder = parseInt(parts[2])
    const tokenReward = parts[3]
    const rarity = parts[4] as 'NORMAL' | 'RARE' | 'LEGENDARY'

    // Extract hint if present (everything after the 5th colon)
    let hint = undefined
    if (parts.length > 5) {
      const hintText = parts.slice(5).join(':').replace(/;/g, ':')
      // We'll need to look up the full hint from database based on code
      hint = {
        title: 'Location Hint',
        content: hintText
      }
    }

    const metadata: QRMetadata = {
      code,
      name: `QR Code ${code}`, // This will be looked up from database
      phase,
      sequenceOrder,
      rarity,
      tokenReward,
      hint,
      timestamp: Date.now(),
      version: '1.0'
    }

    return metadata
  } catch (error) {
    console.error('Failed to extract QR metadata:', error)
    return null
  }
}

/**
 * Generates a QR code image as data URL
 */
export async function generateQRCode(
  metadata: Omit<QRMetadata, 'timestamp' | 'version'>,
  options: QRGenerationOptions = {}
): Promise<string> {
  const qrData = createQRData(metadata)
  
  const qrOptions = {
    width: options.width || 1024,
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H' as const
  }
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, qrOptions)
    return dataUrl
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

/**
 * Generates a QR code as SVG string
 */
export async function generateQRCodeSVG(
  metadata: Omit<QRMetadata, 'timestamp' | 'version'>,
  options: QRGenerationOptions = {}
): Promise<string> {
  const qrData = createQRData(metadata)
  
  const qrOptions = {
    width: options.width || 1024,
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H' as const
  }
  
  try {
    const svg = await QRCode.toString(qrData, { type: 'svg', ...qrOptions })
    return svg
  } catch (error) {
    throw new Error(`Failed to generate QR code SVG: ${error}`)
  }
}

/**
 * Validates QR metadata against expected values
 */
export function validateQRMetadata(
  scannedMetadata: QRMetadata,
  expectedCode: string
): { isValid: boolean; error?: string } {
  // Check if the scanned QR matches the expected code
  if (scannedMetadata.code !== expectedCode) {
    return {
      isValid: false,
      error: `Wrong QR code. Expected ${expectedCode}, got ${scannedMetadata.code}`
    }
  }
  
  // Check if QR is not too old (prevent replay attacks)
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
  if (Date.now() - scannedMetadata.timestamp > maxAge) {
    return {
      isValid: false,
      error: 'QR code has expired'
    }
  }
  
  // Check version compatibility
  if (scannedMetadata.version !== '1.0') {
    return {
      isValid: false,
      error: 'Unsupported QR code version'
    }
  }
  
  return { isValid: true }
}

/**
 * Creates a display-friendly QR code with metadata overlay
 */
export async function generateDisplayQRCode(
  metadata: Omit<QRMetadata, 'timestamp' | 'version'>,
  options: QRGenerationOptions = {}
): Promise<{ qrCodeDataUrl: string; metadata: QRMetadata }> {
  const qrCodeDataUrl = await generateQRCode(metadata, options)
  const fullMetadata: QRMetadata = {
    ...metadata,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  return {
    qrCodeDataUrl,
    metadata: fullMetadata
  }
}
