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
 * Creates a QR code data string with embedded metadata
 * The format is: TOKEN_CRUNCHIES://[base64-encoded-metadata]
 */
export function createQRData(metadata: Omit<QRMetadata, 'timestamp' | 'version'>): string {
  const fullMetadata: QRMetadata = {
    ...metadata,
    timestamp: Date.now(),
    version: '1.0'
  }
  
  // Convert metadata to base64 for embedding
  const metadataJson = JSON.stringify(fullMetadata)
  const encodedMetadata = Buffer.from(metadataJson).toString('base64')
  
  // Create custom protocol URL with embedded metadata
  return `TOKEN_CRUNCHIES://${encodedMetadata}`
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
    
    // Extract and decode metadata
    const encodedMetadata = qrData.replace('TOKEN_CRUNCHIES://', '')
    const metadataJson = Buffer.from(encodedMetadata, 'base64').toString('utf-8')
    const metadata = JSON.parse(metadataJson) as QRMetadata
    
    // Validate required fields
    if (!metadata.code || !metadata.name || !metadata.phase || !metadata.sequenceOrder) {
      throw new Error('Invalid metadata structure')
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
    width: options.width || 512,
    margin: options.margin || 4,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
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
    width: options.width || 512,
    margin: options.margin || 4,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
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
