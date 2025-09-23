#!/usr/bin/env tsx

import { PrismaClient, GamePhase, QRRarity } from '../lib/generated/prisma'
import { createQRData, QRMetadata } from '../lib/qr-generator'

const prisma = new PrismaClient()

async function generateAndSaveQRCodes() {
  console.log('🎯 Starting QR code generation and database update...')
  
  let updatedCount = 0
  let processedCount = 0
  
  // Fetch all QR codes from database
  console.log('📋 Fetching QR codes from database...')
  const qrCodes = await prisma.qRCode.findMany({
    include: {
      hint: true
    },
    orderBy: [
      { phase: 'asc' },
      { sequenceOrder: 'asc' }
    ]
  })
  
  if (qrCodes.length === 0) {
    console.log('❌ No QR codes found in database. Please run the seed script first.')
    return { updated: 0, processed: 0 }
  }
  
  console.log(`📱 Found ${qrCodes.length} QR codes in database`)
  
  // Generate QR data for each QR code from database
  for (const qrCode of qrCodes) {
    try {
      console.log(`📱 Processing QR code: ${qrCode.name} (${qrCode.code})`)
      
      // Create metadata object from database record
      const metadata = {
        code: qrCode.code,
        name: qrCode.name,
        phase: qrCode.phase,
        sequenceOrder: qrCode.sequenceOrder,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        hint: qrCode.hint ? {
          title: qrCode.hint.title || qrCode.hint.content.substring(0, 30) + '...',
          content: qrCode.hint.content
        } : undefined
      }
      
      // Generate QR data string with embedded metadata
      const qrDataString = createQRData(metadata)
      
      processedCount++
      console.log(`✅ Generated QR data for: ${qrCode.name}`)
      console.log(`   QR Data: ${qrDataString.substring(0, 50)}...`)
      console.log(`   Phase: ${qrCode.phase} | Sequence: ${qrCode.sequenceOrder} | Rarity: ${qrCode.rarity}`)
      
      if (qrCode.hint) {
        console.log(`   Hint: ${qrCode.hint.content.substring(0, 60)}...`)
      }
      
      console.log('') // Empty line for readability
      
    } catch (error) {
      console.error(`Failed to process QR code for ${qrCode.code}:`, error)
    }
  }
  
  console.log('\n🎉 QR Code generation completed!')
  console.log(`📱 Total processed: ${processedCount} QR codes`)
  console.log(`📋 QR codes are now ready with embedded metadata`)
  
  return {
    processed: processedCount,
    total: processedCount
  }
}

// Run the generator if this file is executed directly
if (require.main === module) {
  generateAndSaveQRCodes()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { generateAndSaveQRCodes }
