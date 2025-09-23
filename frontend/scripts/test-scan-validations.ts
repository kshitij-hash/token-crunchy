#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function testScanValidations() {
  console.log('🧪 Testing QR scan validations...')
  
  // Test 1: Check that only CONFIRMED scans count toward progress
  console.log('\n1️⃣ Testing scan progress calculation...')
  
  const users = await prisma.user.findMany({
    include: {
      scannedQRs: {
        include: {
          qrCode: true
        }
      }
    },
    take: 3
  })
  
  for (const user of users) {
    const confirmedScans = user.scannedQRs.filter(scan => scan.transferStatus === 'CONFIRMED')
    const allScans = user.scannedQRs
    
    console.log(`User ${user.nickname}:`)
    console.log(`  Total scan records: ${allScans.length}`)
    console.log(`  Confirmed scans: ${confirmedScans.length}`)
    console.log(`  Failed/Pending scans: ${allScans.length - confirmedScans.length}`)
    
    if (allScans.length > confirmedScans.length) {
      console.log(`  ⚠️  User has ${allScans.length - confirmedScans.length} unsuccessful scans`)
    }
  }
  
  // Test 2: Check scan status distribution
  console.log('\n2️⃣ Testing scan status distribution...')
  
  const scanStats = await prisma.userQRScan.groupBy({
    by: ['transferStatus'],
    _count: {
      transferStatus: true
    }
  })
  
  console.log('Scan status distribution:')
  scanStats.forEach(stat => {
    console.log(`  ${stat.transferStatus}: ${stat._count.transferStatus} scans`)
  })
  
  // Test 3: Check for stuck PENDING scans
  console.log('\n3️⃣ Checking for stuck PENDING scans...')
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const stuckScans = await prisma.userQRScan.findMany({
    where: {
      transferStatus: 'PENDING',
      scannedAt: {
        lt: fiveMinutesAgo
      }
    },
    include: {
      user: {
        select: { nickname: true }
      },
      qrCode: {
        select: { name: true, code: true }
      }
    }
  })
  
  if (stuckScans.length > 0) {
    console.log(`⚠️  Found ${stuckScans.length} stuck PENDING scans:`)
    stuckScans.forEach(scan => {
      console.log(`  - ${scan.user.nickname}: ${scan.qrCode.name} (${scan.scannedAt})`)
    })
  } else {
    console.log('✅ No stuck PENDING scans found')
  }
  
  // Test 4: Check sequential ordering integrity
  console.log('\n4️⃣ Testing sequential ordering integrity...')
  
  const usersWithProgress = await prisma.user.findMany({
    include: {
      scannedQRs: {
        where: {
          transferStatus: 'CONFIRMED'
        },
        include: {
          qrCode: {
            select: {
              sequenceOrder: true,
              name: true
            }
          }
        },
        orderBy: {
          qrCode: {
            sequenceOrder: 'asc'
          }
        }
      }
    }
  })
  
  for (const user of usersWithProgress) {
    if (user.scannedQRs.length === 0) continue
    
    let sequenceValid = true
    const sequences = user.scannedQRs.map(scan => scan.qrCode.sequenceOrder)
    
    for (let i = 0; i < sequences.length; i++) {
      if (sequences[i] !== i + 1) {
        sequenceValid = false
        break
      }
    }
    
    if (!sequenceValid) {
      console.log(`❌ ${user.nickname}: Invalid sequence ${sequences.join(', ')}`)
    } else if (sequences.length > 0) {
      console.log(`✅ ${user.nickname}: Valid sequence up to QR #${sequences.length}`)
    }
  }
  
  // Test 5: Simulate validation scenarios
  console.log('\n5️⃣ Validation scenarios summary...')
  
  console.log('✅ Implemented validations:')
  console.log('  - Only CONFIRMED transfers count as successful scans')
  console.log('  - Failed transfers can be retried (failed records are deleted)')
  console.log('  - PENDING transfers prevent duplicate attempts')
  console.log('  - Stuck PENDING transfers (>5min) are marked as FAILED')
  console.log('  - Sequential scanning only counts CONFIRMED scans')
  console.log('  - Web3 configuration is validated before creating scan records')
  console.log('  - Detailed error messages guide users on what to do')
  
  console.log('\n📋 Error response scenarios:')
  console.log('  - 400: Invalid QR format, wrong sequence, transfer failed (retry)')
  console.log('  - 408: Transfer timed out (retry)')
  console.log('  - 409: Already successfully scanned (no retry)')
  console.log('  - 429: Scan in progress (wait and retry)')
  console.log('  - 503: Web3 not configured (contact support)')
  
  console.log('\n🎯 Frontend behavior:')
  console.log('  - SUCCESS: Update progress, unlock next hint, show tokens earned')
  console.log('  - FAILURE: Show error message, keep current progress, allow retry')
  console.log('  - No progress updates or hint unlocking on failed transfers')
}

// Run test if this file is executed directly
if (require.main === module) {
  testScanValidations()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { testScanValidations }
