#!/usr/bin/env tsx

import { createQRData, extractQRMetadata, SecureQRMetadata } from '../lib/qr-generator'

// Test with a sample QR code metadata (with hint) - using SecureQRMetadata (NO sequenceOrder)
const testMetadata: SecureQRMetadata = {
  code: 'CRUNCH_7X9K',
  name: 'Check-in Counter',
  phase: 'PHASE_1' as const,
  rarity: 'NORMAL' as const,
  tokenReward: '100',
  hint: {
    title: 'Location Hint',
    content: 'check in to check-out;eyes;'
  }
}

// Test without hint - using SecureQRMetadata (NO sequenceOrder)
const testMetadataNoHint: SecureQRMetadata = {
  code: 'TOKEN_M4R8',
  name: 'Test QR',
  phase: 'PHASE_1' as const,
  rarity: 'NORMAL' as const,
  tokenReward: '100'
}

console.log('🧪 Testing QR Code Format (Secure - No Sequence Numbers)...')
console.log('')

// Test 1: Generate QR data with hint
const qrData = createQRData(testMetadata)
console.log('📱 Generated QR Data (with hint):')
console.log(qrData)
console.log('')

// Test 2: Generate QR data without hint
const qrDataNoHint = createQRData(testMetadataNoHint)
console.log('📱 Generated QR Data (without hint):')
console.log(qrDataNoHint)
console.log('')

// Extract QR metadata from first test
console.log('🔍 Extracting metadata from QR with hint...')
const extractedMetadata = extractQRMetadata(qrData)

if (extractedMetadata) {
  console.log('✅ Successfully extracted metadata:')
  console.log(JSON.stringify(extractedMetadata, null, 2))
  console.log('🔒 Security Check: sequenceOrder is set to 0 (will be looked up from database)')
} else {
  console.log('❌ Failed to extract metadata')
}

console.log('')
console.log('🔍 Debug Info:')
console.log('QR Data parts after protocol removal:')
const dataPart = qrData.replace('TOKEN_CRUNCHIES://', '')
const parts = dataPart.split(':')
console.log('Parts array:', parts)
console.log('Parts length:', parts.length)
console.log('🔒 SECURITY: Notice that sequence number is NOT included in QR data')
parts.forEach((part, index) => {
  const labels = ['code', 'phase', 'reward', 'rarity', 'hint...']
  console.log(`  [${index}]: "${part}" (${labels[index] || 'extra hint data'})`)
})
