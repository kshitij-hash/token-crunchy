import { PrismaClient, GamePhase, QRRarity } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // First, let's create the QR codes for Phase 1 with hints
  const qrCodesWithHints = [
    {
      code: 'MYSTERY_QR_001',
      name: 'First Discovery',
      description: 'The beginning of your adventure',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 1,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'The Welcome Mat',
        content: 'Where visitors first arrive, they probably have more than just room keys'
      }
    },
    {
      code: 'MYSTERY_QR_002',
      name: 'Hidden Homes',
      description: 'Small dwellings hold secrets',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 2,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Tiny Treasures',
        content: 'Those little houses look sus... maybe check em out?'
      }
    },
    {
      code: 'MYSTERY_QR_003',
      name: 'Aquatic Adventure',
      description: 'Where water meets wonder',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 3,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Splash Zone',
        content: 'Go splash around the big pool, might find more than chlorine'
      }
    },
    {
      code: 'MYSTERY_QR_004',
      name: 'Hunger Station',
      description: 'Where appetites are satisfied',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 4,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Feast Mode',
        content: 'Grab some food and maybe grab something else too'
      }
    },
    {
      code: 'MYSTERY_QR_005',
      name: 'Beat Drop Zone',
      description: 'Where music meets magic',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 5,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Sound Waves',
        content: 'Where the beats drop, tokens might drop too (near the big splash)'
      }
    },
    {
      code: 'MYSTERY_QR_006',
      name: 'Central Command',
      description: 'The heart of operations',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 6,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'All Roads Lead Here',
        content: 'Where all roads lead...'
      }
    }
  ]

  // Create QR codes with hints
  for (const qrData of qrCodesWithHints) {
    const { hint, ...qrCodeData } = qrData
    
    // Check if QR code already exists by code OR by phase+sequenceOrder
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { code: qrCodeData.code },
          { 
            phase: qrCodeData.phase,
            sequenceOrder: qrCodeData.sequenceOrder
          }
        ]
      },
      include: { hint: true }
    })

    if (existingQR) {
      console.log(`⏭️  QR code ${qrCodeData.name} already exists (${existingQR.code}), updating hint if needed...`)
      
      // Update hint if it doesn't exist or is different
      if (!existingQR.hint) {
        await prisma.hint.create({
          data: {
            ...hint,
            qrCodeId: existingQR.id
          }
        })
        console.log(`✅ Added hint to existing QR code: ${existingQR.name}`)
      } else if (existingQR.hint.content !== hint.content) {
        await prisma.hint.update({
          where: { id: existingQR.hint.id },
          data: hint
        })
        console.log(`✅ Updated hint for QR code: ${existingQR.name}`)
      } else {
        console.log(`ℹ️  Hint already up to date for: ${existingQR.name}`)
      }
      continue
    }

    // Create QR code with hint
    const qrCode = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created QR code: ${qrCode.name} with hint: "${qrCode.hint?.content}"`)
  }

  // Add placeholder QR codes for remaining Phase 1 slots (7-8)
  const remainingPhase1QRs = [
    {
      code: 'PHASE1_QR_007',
      name: 'Mystery Location 7',
      description: 'Phase 1 QR code 7',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 7,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Mystery Location 7',
        content: 'Hint for location 7 will be revealed soon...'
      }
    },
    {
      code: 'PHASE1_QR_008',
      name: 'Mystery Location 8',
      description: 'Phase 1 QR code 8',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 8,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Mystery Location 8',
        content: 'Hint for location 8 will be revealed soon...'
      }
    }
  ]

  for (const qrData of remainingPhase1QRs) {
    const { hint, ...qrCodeData } = qrData
    
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { code: qrCodeData.code },
          { 
            phase: qrCodeData.phase,
            sequenceOrder: qrCodeData.sequenceOrder
          }
        ]
      },
      include: { hint: true }
    })

    if (existingQR) {
      console.log(`⏭️  QR code ${qrCodeData.name} already exists, skipping...`)
      continue
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created placeholder QR code: ${qrCode.name}`)
  }

  // Add Phase 2 QR codes (rare)
  const phase2QRs = [
    {
      code: 'PHASE2_RARE_001',
      name: 'Rare Location 1',
      description: 'Phase 2 rare QR code 1',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 1,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Rare Location 1',
        content: 'This rare location requires completing Phase 1 first...'
      }
    },
    {
      code: 'PHASE2_RARE_002',
      name: 'Rare Location 2',
      description: 'Phase 2 rare QR code 2',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 2,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Rare Location 2',
        content: 'Another rare location awaits the dedicated hunters...'
      }
    },
    {
      code: 'PHASE2_RARE_003',
      name: 'Rare Location 3',
      description: 'Phase 2 rare QR code 3',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 3,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Rare Location 3',
        content: 'The third rare location holds special secrets...'
      }
    },
    {
      code: 'PHASE2_RARE_004',
      name: 'Rare Location 4',
      description: 'Phase 2 rare QR code 4',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 4,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Rare Location 4',
        content: 'The final rare location of Phase 2...'
      }
    }
  ]

  for (const qrData of phase2QRs) {
    const { hint, ...qrCodeData } = qrData
    
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { code: qrCodeData.code },
          { 
            phase: qrCodeData.phase,
            sequenceOrder: qrCodeData.sequenceOrder
          }
        ]
      },
      include: { hint: true }
    })

    if (existingQR) {
      console.log(`⏭️  QR code ${qrCodeData.name} already exists, skipping...`)
      continue
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created rare QR code: ${qrCode.name}`)
  }

  // Add Phase 3 QR code (legendary)
  const phase3QR = {
    code: 'PHASE3_LEGENDARY_001',
    name: 'Legendary Location',
    description: 'The ultimate legendary QR code',
    phase: GamePhase.PHASE_3,
    sequenceOrder: 1,
    rarity: QRRarity.LEGENDARY,
    tokenReward: '500',
    hint: {
      title: 'Legendary Location',
      content: 'The legendary location will be revealed at the IRL event...'
    }
  }

  const existingLegendary = await prisma.qRCode.findFirst({
    where: {
      OR: [
        { code: phase3QR.code },
        { 
          phase: phase3QR.phase,
          sequenceOrder: phase3QR.sequenceOrder
        }
      ]
    },
    include: { hint: true }
  })

  if (!existingLegendary) {
    const { hint, ...qrCodeData } = phase3QR
    
    const legendaryQR = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created legendary QR code: ${legendaryQR.name}`)
  } else {
    console.log(`⏭️  Legendary QR code already exists, skipping...`)
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
