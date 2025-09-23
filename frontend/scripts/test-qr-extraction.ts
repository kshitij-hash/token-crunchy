#!/usr/bin/env tsx

import { extractQRMetadata, createQRData } from '../lib/qr-generator'
import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function testQRExtraction() {
  console.log('🧪 Testing QR code extraction logic...')
  
  // Get a sample QR code from database
  const sampleQR = await prisma.qRCode.findFirst({
    where: { code: 'MYSTERY_QR_001' },
    include: { hint: true }
  })

  if (!sampleQR) {
    console.log('❌ No sample QR code found in database')
    return
  }

  console.log(`📱 Testing with QR code: ${sampleQR.name} (${sampleQR.code})`)

  // Create the QR data string (what would be scanned)
  const qrDataString = createQRData({
    code: sampleQR.code,
    name: sampleQR.name,
    phase: sampleQR.phase,
    sequenceOrder: sampleQR.sequenceOrder,
    rarity: sampleQR.rarity,
    tokenReward: sampleQR.tokenReward.toString(),
    hint: sampleQR.hint ? {
      title: sampleQR.hint.title || 'Hint',
      content: sampleQR.hint.content
    } : undefined
  })

  console.log(`📄 Generated QR data string: ${qrDataString}`)

  // Extract metadata from the QR data string
  const extractedMetadata = extractQRMetadata(qrDataString)

  if (!extractedMetadata) {
    console.log('❌ Failed to extract metadata from QR code')
    return
  }

  console.log('✅ Successfully extracted metadata:')
  console.log(`   Code: ${extractedMetadata.code}`)
  console.log(`   Phase: ${extractedMetadata.phase}`)
  console.log(`   Sequence: ${extractedMetadata.sequenceOrder}`)
  console.log(`   Rarity: ${extractedMetadata.rarity}`)
  console.log(`   Reward: ${extractedMetadata.tokenReward}`)
  if (extractedMetadata.hint) {
    console.log(`   Hint: ${extractedMetadata.hint.content}`)
  }

  // Verify the extraction matches the database record
  const matches = {
    code: extractedMetadata.code === sampleQR.code,
    phase: extractedMetadata.phase === sampleQR.phase,
    sequence: extractedMetadata.sequenceOrder === sampleQR.sequenceOrder,
    rarity: extractedMetadata.rarity === sampleQR.rarity,
    reward: extractedMetadata.tokenReward === sampleQR.tokenReward.toString()
  }

  console.log('\n🔍 Validation Results:')
  Object.entries(matches).forEach(([key, match]) => {
    console.log(`   ${key}: ${match ? '✅' : '❌'}`)
  })

  const allMatch = Object.values(matches).every(Boolean)
  console.log(`\n${allMatch ? '🎉' : '❌'} Overall validation: ${allMatch ? 'PASSED' : 'FAILED'}`)

  if (allMatch) {
    console.log('✅ QR extraction logic is working correctly!')
    console.log('✅ The scan route should now be able to process QR codes properly.')
  } else {
    console.log('❌ There are issues with the QR extraction logic.')
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testQRExtraction()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { testQRExtraction }
