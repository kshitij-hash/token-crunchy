#!/usr/bin/env tsx

/**
 * Regenerate QR codes with security fix and new hints
 * - Removes sequence numbers from QR metadata to prevent extraction/arrangement
 * - Updates with new hint content provided by user
 */

import { PrismaClient } from '../lib/generated/prisma'
import { generateQRCode, generateQRCodeSVG, createQRData } from '../lib/qr-generator'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

// QR Code definitions with new hints
const qrCodeDefinitions = [
  // Phase 1 - Normal QRs (100 tokens each)
  {
    code: 'QR001',
    name: 'Check-in Counter',
    phase: 'PHASE_1' as const,
    sequenceOrder: 1,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'check in to check-out:eyes:'
    }
  },
  {
    code: 'QR002',
    name: 'Suspicious Houses',
    phase: 'PHASE_1' as const,
    sequenceOrder: 2,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'those little houses look sus... maybe check em out?'
    }
  },
  {
    code: 'QR003',
    name: 'Food Court Secret',
    phase: 'PHASE_1' as const,
    sequenceOrder: 3,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'grab some food and maybe grab something else too :eyes:'
    }
  },
  {
    code: 'QR004',
    name: 'Beat Drop Zone',
    phase: 'PHASE_1' as const,
    sequenceOrder: 4,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'where the beats drop, tokens might drop too :musical_note:'
    }
  },
  {
    code: 'QR005',
    name: 'Trail Convergence',
    phase: 'PHASE_1' as const,
    sequenceOrder: 5,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'All trails eventually crunch back here.'
    }
  },
  {
    code: 'QR006',
    name: 'Ocean Splash',
    phase: 'PHASE_1' as const,
    sequenceOrder: 6,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'go splash around the ocean, might find more than salt'
    }
  },
  {
    code: 'QR007',
    name: 'Silent Pond Watcher',
    phase: 'PHASE_1' as const,
    sequenceOrder: 7,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'A silent pond watching from the sidelines'
    }
  },
  {
    code: 'QR008',
    name: 'Silent Tails',
    phase: 'PHASE_1' as const,
    sequenceOrder: 8,
    rarity: 'NORMAL' as const,
    tokenReward: '100',
    hint: {
      title: 'Location Hint',
      content: 'Silent Tails'
    }
  },

  // Phase 2 - Rare QRs (250 tokens each)
  {
    code: 'QR009',
    name: 'Floating Swimmer',
    phase: 'PHASE_2' as const,
    sequenceOrder: 9,
    rarity: 'RARE' as const,
    tokenReward: '250',
    hint: {
      title: 'Location Hint',
      content: 'A swimmer that only floats'
    }
  },
  {
    code: 'QR010',
    name: 'Pocket Loot',
    phase: 'PHASE_2' as const,
    sequenceOrder: 10,
    rarity: 'RARE' as const,
    tokenReward: '250',
    hint: {
      title: 'Location Hint',
      content: 'The real loot might be ringing in someone\'s pocket'
    }
  },
  {
    code: 'QR011',
    name: 'Godfather\'s Mercy',
    phase: 'PHASE_2' as const,
    sequenceOrder: 11,
    rarity: 'RARE' as const,
    tokenReward: '250',
    hint: {
      title: 'Location Hint',
      content: 'Ask Godfather, maybe he can show some mercy'
    }
  },
  {
    code: 'QR012',
    name: 'Supreme Secrets',
    phase: 'PHASE_2' as const,
    sequenceOrder: 12,
    rarity: 'RARE' as const,
    tokenReward: '250',
    hint: {
      title: 'Location Hint',
      content: 'Supreme leader knows supreme secrets'
    }
  },

  // Phase 3 - Legendary QR (500 tokens)
  {
    code: 'QR013',
    name: 'Legend Never Dies',
    phase: 'PHASE_3' as const,
    sequenceOrder: 13,
    rarity: 'LEGENDARY' as const,
    tokenReward: '500',
    hint: {
      title: 'Location Hint',
      content: 'Legend never dies'
    }
  }
]

async function clearExistingData() {
  console.log('🗑️  Clearing existing QR codes and hints...')
  
  // Delete in correct order due to foreign key constraints
  await prisma.userQRScan.deleteMany({})
  await prisma.hint.deleteMany({})
  await prisma.qRCode.deleteMany({})
  
  console.log('✅ Cleared existing data')
}

async function createQRCodesInDatabase() {
  console.log('📝 Creating QR codes in database...')
  
  for (const qrDef of qrCodeDefinitions) {
    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        code: qrDef.code,
        name: qrDef.name,
        phase: qrDef.phase,
        sequenceOrder: qrDef.sequenceOrder,
        rarity: qrDef.rarity,
        tokenReward: qrDef.tokenReward,
        isActive: true
      }
    })

    // Create hint record
    await prisma.hint.create({
      data: {
        title: qrDef.hint.title,
        content: qrDef.hint.content,
        qrCodeId: qrCode.id
      }
    })

    console.log(`✅ Created ${qrDef.code}: ${qrDef.name}`)
  }
  
  console.log('✅ All QR codes created in database')
}

async function generateQRCodeFiles() {
  console.log('🎨 Generating QR code files...')
  
  // Create directories
  const baseDir = path.join(process.cwd(), 'generated-qr-codes')
  const pngDir = path.join(baseDir, 'png')
  const svgDir = path.join(baseDir, 'svg')
  
  await fs.mkdir(baseDir, { recursive: true })
  await fs.mkdir(pngDir, { recursive: true })
  await fs.mkdir(svgDir, { recursive: true })
  
  const manifest = []
  
  for (const qrDef of qrCodeDefinitions) {
    const metadata = {
      code: qrDef.code,
      name: qrDef.name,
      phase: qrDef.phase,
      sequenceOrder: qrDef.sequenceOrder,
      rarity: qrDef.rarity,
      tokenReward: qrDef.tokenReward,
      hint: qrDef.hint
    }
    
    // Generate PNG
    const pngDataUrl = await generateQRCode(metadata, {
      width: 2048,
      errorCorrectionLevel: 'H'
    })
    
    // Convert data URL to buffer and save
    const pngBuffer = Buffer.from(pngDataUrl.split(',')[1], 'base64')
    const pngPath = path.join(pngDir, `${qrDef.code}.png`)
    await fs.writeFile(pngPath, pngBuffer)
    
    // Generate SVG
    const svgContent = await generateQRCodeSVG(metadata, {
      width: 2048,
      errorCorrectionLevel: 'H'
    })
    
    const svgPath = path.join(svgDir, `${qrDef.code}.svg`)
    await fs.writeFile(svgPath, svgContent)
    
    // Add to manifest
    manifest.push({
      code: qrDef.code,
      name: qrDef.name,
      phase: qrDef.phase,
      sequenceOrder: qrDef.sequenceOrder,
      rarity: qrDef.rarity,
      tokenReward: qrDef.tokenReward,
      hint: qrDef.hint.content,
      files: {
        png: `png/${qrDef.code}.png`,
        svg: `svg/${qrDef.code}.svg`
      },
      qrData: createQRData(metadata)
    })
    
    console.log(`✅ Generated files for ${qrDef.code}`)
  }
  
  // Save manifest
  const manifestPath = path.join(baseDir, 'qr-codes-manifest.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  
  console.log('✅ QR code files generated')
  console.log(`📁 Files saved to: ${baseDir}`)
}

async function generatePreviewHTML() {
  console.log('🌐 Generating HTML preview...')
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Crunchies QR Codes - Secure Version</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .security-notice { background: #e8f5e8; border: 2px solid #4caf50; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .phase { margin-bottom: 40px; }
        .phase-title { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .qr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .qr-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .qr-image { text-align: center; margin-bottom: 15px; }
        .qr-image img { max-width: 200px; height: 200px; border: 1px solid #ddd; }
        .qr-info h3 { margin: 0 0 10px 0; color: #333; }
        .qr-details { font-size: 14px; color: #666; margin-bottom: 10px; }
        .hint { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; font-style: italic; }
        .rarity-normal { border-left: 4px solid #28a745; }
        .rarity-rare { border-left: 4px solid #ffc107; }
        .rarity-legendary { border-left: 4px solid #dc3545; }
        .qr-data { font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Token Crunchies QR Codes</h1>
            <p><strong>Secure Version - No Sequence Numbers in QR Data</strong></p>
        </div>
        
        <div class="security-notice">
            <h3>🔒 Security Enhancement</h3>
            <p><strong>Fixed:</strong> Sequence numbers are no longer included in QR code metadata to prevent users from extracting and arranging QR codes without finding them physically.</p>
            <p><strong>New Format:</strong> TOKEN_CRUNCHIES://[code]:[phase]:[reward]:[rarity]:[hint]</p>
        </div>

        ${qrCodeDefinitions.map(qr => `
        <div class="phase">
            ${qrCodeDefinitions.findIndex(q => q.phase === qr.phase) === qrCodeDefinitions.findIndex(q => q.code === qr.code) ? 
              `<h2 class="phase-title">${qr.phase.replace('_', ' ')} - ${qr.rarity} QRs (${qr.tokenReward} tokens each)</h2>` : ''}
            <div class="qr-grid">
                <div class="qr-card rarity-${qr.rarity.toLowerCase()}">
                    <div class="qr-image">
                        <img src="png/${qr.code}.png" alt="${qr.name}" />
                    </div>
                    <div class="qr-info">
                        <h3>${qr.name}</h3>
                        <div class="qr-details">
                            <strong>Code:</strong> ${qr.code}<br>
                            <strong>Phase:</strong> ${qr.phase}<br>
                            <strong>Sequence:</strong> #${qr.sequenceOrder}<br>
                            <strong>Rarity:</strong> ${qr.rarity}<br>
                            <strong>Reward:</strong> ${qr.tokenReward} tokens
                        </div>
                        <div class="hint">
                            <strong>Hint:</strong> ${qr.hint.content}
                        </div>
                        <div class="qr-data">
                            <strong>QR Data:</strong> ${createQRData({
                              code: qr.code,
                              name: qr.name,
                              phase: qr.phase,
                              sequenceOrder: qr.sequenceOrder,
                              rarity: qr.rarity,
                              tokenReward: qr.tokenReward,
                              hint: qr.hint
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total QR Codes: ${qrCodeDefinitions.length}</p>
        </div>
    </div>
</body>
</html>`
  
  const htmlPath = path.join(process.cwd(), 'generated-qr-codes', 'qr-codes-preview.html')
  await fs.writeFile(htmlPath, htmlContent)
  
  console.log('✅ HTML preview generated')
}

async function verifyDatabase() {
  console.log('🔍 Verifying database records...')
  
  const qrCodes = await prisma.qRCode.findMany({
    include: {
      hint: true
    },
    orderBy: {
      sequenceOrder: 'asc'
    }
  })
  
  console.log(`📊 Database contains ${qrCodes.length} QR codes:`)
  
  for (const qr of qrCodes) {
    console.log(`  ${qr.code}: ${qr.name} (${qr.phase}, Seq: ${qr.sequenceOrder}, ${qr.rarity}, ${qr.tokenReward} tokens)`)
    if (qr.hint) {
      console.log(`    Hint: "${qr.hint.content}"`)
    }
  }
  
  console.log('✅ Database verification complete')
}

async function main() {
  try {
    console.log('🚀 Starting secure QR code regeneration...')
    console.log('🔒 Security Fix: Removing sequence numbers from QR metadata')
    console.log('💬 Updating hints with new content')
    console.log('')
    
    await clearExistingData()
    await createQRCodesInDatabase()
    await generateQRCodeFiles()
    await generatePreviewHTML()
    await verifyDatabase()
    
    console.log('')
    console.log('🎉 QR code regeneration complete!')
    console.log('📁 Files generated in: ./generated-qr-codes/')
    console.log('🌐 View preview: ./generated-qr-codes/qr-codes-preview.html')
    console.log('')
    console.log('🔒 Security Enhancement Applied:')
    console.log('   - Sequence numbers removed from QR metadata')
    console.log('   - Users can no longer extract and arrange QR codes')
    console.log('   - QR codes must be found physically in the correct order')
    
  } catch (error) {
    console.error('❌ Error during QR code generation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
