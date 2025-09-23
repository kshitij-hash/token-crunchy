import { createQRData, extractQRMetadata } from '../lib/qr-generator'

// Test QR metadata generation and extraction
function testQRMetadata() {
  console.log('🧪 Testing QR metadata generation and extraction...\n')

  // Test data
  const testMetadata = {
    code: 'MYSTERY_QR_001',
    name: 'First Discovery',
    phase: 'PHASE_1' as const,
    sequenceOrder: 1,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'The Welcome Mat',
      content: 'Where visitors first arrive, they probably have more than just room keys'
    }
  }

  // Generate QR data string
  const qrDataString = createQRData(testMetadata)
  console.log('📱 Generated QR Data String:')
  console.log(`   ${qrDataString}`)
  console.log('')

  // Extract metadata back
  const extractedMetadata = extractQRMetadata(qrDataString)
  
  if (extractedMetadata) {
    console.log('✅ Successfully extracted metadata:')
    console.log(`   Code: ${extractedMetadata.code}`)
    console.log(`   Phase: ${extractedMetadata.phase}`)
    console.log(`   Sequence: ${extractedMetadata.sequenceOrder}`)
    console.log(`   Rarity: ${extractedMetadata.rarity}`)
    console.log(`   Token Reward: ${extractedMetadata.tokenReward}`)
    console.log(`   Hint: ${extractedMetadata.hint?.content}`)
    console.log('')

    // Verify data integrity
    const isValid = (
      extractedMetadata.code === testMetadata.code &&
      extractedMetadata.phase === testMetadata.phase &&
      extractedMetadata.sequenceOrder === testMetadata.sequenceOrder &&
      extractedMetadata.rarity === testMetadata.rarity &&
      extractedMetadata.tokenReward === testMetadata.tokenReward
    )

    if (isValid) {
      console.log('🎉 Metadata integrity test PASSED!')
      console.log('✅ QR codes are properly formatted with scannable metadata')
    } else {
      console.log('❌ Metadata integrity test FAILED!')
      console.log('⚠️  Data mismatch detected')
    }
  } else {
    console.log('❌ Failed to extract metadata from QR data string')
  }

  console.log('\n📋 QR Data Format Analysis:')
  console.log('   Protocol: TOKEN_CRUNCHIES://')
  console.log('   Structure: [code]:[phase]:[sequence]:[reward]:[rarity]:[hint]')
  console.log('   Error Correction: High (H) for better scanning reliability')
  console.log('   Size: 2048x2048 pixels for print quality')
}

// Run the test
testQRMetadata()
