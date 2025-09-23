// TODO: Database is not getting updated after successfull run 

import { NextResponse } from 'next/server'
import { withAuth, checkRateLimit } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'
import { transferTokensToUser } from '../../../../lib/web3/treasury-wallet'
import { extractQRMetadata } from '../../../../lib/qr-generator'

// Helper function to convert numbers to ordinals (1st, 2nd, 3rd, etc.)
function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = num % 100
  return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0])
}

export const POST = withAuth(async (request, user) => {
  try {
    // Rate limiting per user
    const rateLimit = checkRateLimit(`scan:${user.id}`, 20, 60000) // 20 scans per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many scan attempts. Please wait before scanning again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      )
    }

    // Extract metadata from the scanned QR code
    console.log('Scanned QR code:', qrCode)
    const qrMetadata = extractQRMetadata(qrCode)
    
    if (!qrMetadata) {
      console.log('Failed to extract metadata from QR code:', qrCode)
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      )
    }

    console.log('Extracted QR metadata:', {
      code: qrMetadata.code,
      phase: qrMetadata.phase,
      rarity: qrMetadata.rarity,
      reward: qrMetadata.tokenReward,
      note: 'Sequence number will be looked up from database (not in QR for security)'
    })

    // Find the QR code in database using the extracted code
    const qrCodeRecord = await prisma.qRCode.findUnique({
      where: { 
        code: qrMetadata.code,
        isActive: true
      },
      include: {
        hint: true
      }
    })

    if (!qrCodeRecord) {
      console.log('QR code not found in database:', qrMetadata.code)
      return NextResponse.json(
        { error: 'Invalid or inactive QR code' },
        { status: 404 }
      )
    }

    console.log('Found QR code in database:', {
      id: qrCodeRecord.id,
      name: qrCodeRecord.name,
      code: qrCodeRecord.code,
      phase: qrCodeRecord.phase,
      sequence: qrCodeRecord.sequenceOrder,
      isActive: qrCodeRecord.isActive
    })

    // Validate that the scanned QR metadata matches the database record
    // NOTE: sequenceOrder is no longer validated from QR metadata for security
    if (qrMetadata.phase !== qrCodeRecord.phase || 
        qrMetadata.rarity !== qrCodeRecord.rarity ||
        qrMetadata.tokenReward !== qrCodeRecord.tokenReward.toString()) {
      return NextResponse.json(
        { error: 'QR code metadata mismatch' },
        { status: 400 }
      )
    }

    // Check if user already scanned this QR code
    const existingScan = await prisma.userQRScan.findUnique({
      where: {
        userId_qrCodeId: {
          userId: user.id,
          qrCodeId: qrCodeRecord.id
        }
      }
    })

    if (existingScan) {
      // Check if the existing scan was successful or failed
      if (existingScan.transferStatus === 'CONFIRMED') {
        return NextResponse.json({
          success: false,
          error: 'QR code already successfully scanned',
          message: 'You have already successfully scanned this QR code and received your tokens.',
          scan: {
            id: existingScan.id,
            tokensEarned: existingScan.tokensEarned.toString(),
            scannedAt: existingScan.scannedAt,
            transactionHash: existingScan.transactionHash
          }
        }, { status: 409 })
      } else if (existingScan.transferStatus === 'FAILED') {
        // Allow retry for failed transfers by deleting the failed record
        console.log('Previous scan failed, allowing retry by deleting failed record:', existingScan.id)
        await prisma.userQRScan.delete({
          where: { id: existingScan.id }
        })
        console.log('Deleted failed scan record, proceeding with new attempt')
      } else if (existingScan.transferStatus === 'PENDING') {
        // Check if the pending transfer is stuck (older than 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (existingScan.scannedAt < fiveMinutesAgo) {
          console.log('Pending transfer is stuck, cleaning up and allowing retry:', existingScan.id)
          await prisma.userQRScan.update({
            where: { id: existingScan.id },
            data: { transferStatus: 'FAILED' }
          })
          return NextResponse.json({
            success: false,
            error: 'Previous transfer timed out',
            message: 'Your previous scan attempt timed out. Please try scanning the QR code again.',
            details: {
              reason: 'Transfer took too long to complete',
              suggestion: 'Scan the QR code again to retry the token transfer.'
            }
          }, { status: 408 }) // Request Timeout
        } else {
          return NextResponse.json({
            success: false,
            error: 'QR code scan in progress',
            message: 'This QR code scan is currently being processed. Please wait a moment before trying again.',
            details: {
              reason: 'Transfer still pending',
              suggestion: 'Wait a few seconds and try again if the transfer is taking too long.'
            }
          }, { status: 429 }) // Too Many Requests
        }
      }
    }

    // Get user's current progress
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        qrCodesScanned: true,
        scannedQRs: {
          where: {
            userId: user.id,
            transferStatus: 'CONFIRMED' // Only count successfully transferred scans
          },
          orderBy: {
            qrCode: {
              sequenceOrder: 'asc'
            }
          },
          select: {
            qrCode: {
              select: {
                sequenceOrder: true
              }
            }
          }
        }
      }
    })

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate sequential scanning - users must scan QR codes in order
    const expectedSequence = userRecord.scannedQRs.length + 1
    
    console.log('Sequential validation:', {
      userScannedCount: userRecord.scannedQRs.length,
      expectedSequence,
      receivedSequence: qrCodeRecord.sequenceOrder,
      qrCodeName: qrCodeRecord.name
    })
    
    if (qrCodeRecord.sequenceOrder !== expectedSequence) {
      console.log(`Sequential scan validation failed: Expected ${expectedSequence}, got ${qrCodeRecord.sequenceOrder}`)
      return NextResponse.json(
        { 
          error: `Please scan QR codes in order. You need to find the ${expectedSequence === 1 ? 'first' : getOrdinal(expectedSequence)} QR code first.`,
          expectedSequence,
          receivedSequence: qrCodeRecord.sequenceOrder,
          hint: expectedSequence === 1 ? 'Start with the first QR code!' : `You need to find the ${getOrdinal(expectedSequence)} QR code next.`
        },
        { status: 400 }
      )
    }

    // Pre-validate Web3 configuration before creating scan record
    const { isWeb3Configured, getTreasuryAddress } = await import('../../../../lib/web3/monad-provider')
    
    if (!isWeb3Configured()) {
      console.log('Web3 not configured, rejecting scan')
      return NextResponse.json({
        success: false,
        error: 'Token transfer system not available',
        message: 'The token distribution system is currently unavailable. Please try again later.',
        details: {
          reason: 'Web3 configuration incomplete',
          suggestion: 'Please contact support if this issue persists.'
        }
      }, { status: 503 }) // Service Unavailable
    }

    const treasuryAddress = getTreasuryAddress()
    if (!treasuryAddress) {
      console.log('Treasury wallet not available, rejecting scan')
      return NextResponse.json({
        success: false,
        error: 'Treasury wallet not available',
        message: 'The token distribution wallet is not accessible. Please try again later.',
        details: {
          reason: 'Treasury wallet initialization failed',
          suggestion: 'Please contact support if this issue persists.'
        }
      }, { status: 503 })
    }

    // Create scan record with pending transfer status
    const scanRecord = await prisma.userQRScan.create({
      data: {
        userId: user.id,
        qrCodeId: qrCodeRecord.id,
        tokensEarned: qrCodeRecord.tokenReward,
        transferStatus: 'PENDING'
      }
    })

    // Initiate token transfer
    let transferResult
    try {
      console.log('Initiating token transfer:', {
        userAddress: user.walletAddress,
        amount: qrCodeRecord.tokenReward.toString(),
        qrCode: qrCodeRecord.code
      })

      transferResult = await transferTokensToUser(
        user.walletAddress,
        qrCodeRecord.tokenReward.toString()
      )

      console.log('Token transfer result:', transferResult)

      // Update scan record with transfer result
      await prisma.userQRScan.update({
        where: { id: scanRecord.id },
        data: {
          transactionHash: transferResult.transactionHash,
          transferStatus: transferResult.success ? 'CONFIRMED' : 'FAILED',
          transferredAt: transferResult.success ? new Date() : null,
          gasUsed: transferResult.gasUsed
        }
      })

      console.log('Updated scan record with transfer status:', transferResult.success ? 'CONFIRMED' : 'FAILED')

    } catch (error) {
      console.error('Token transfer error:', error)
      
      // Update scan record as failed
      await prisma.userQRScan.update({
        where: { id: scanRecord.id },
        data: {
          transferStatus: 'FAILED'
        }
      })

      transferResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Transfer failed'
      }
    }

    // Update user stats if transfer was successful
    if (transferResult.success) {
      console.log('Transfer successful, updating user stats...')
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          totalTokens: {
            increment: qrCodeRecord.tokenReward
          },
          qrCodesScanned: {
            increment: 1
          },
          lastScannedAt: new Date()
        }
      })

      console.log('Updated user stats:', {
        userId: user.id,
        newTotalTokens: updatedUser.totalTokens.toString(),
        newQrCodesScanned: updatedUser.qrCodesScanned
      })

      // Update leaderboard
      await updateLeaderboard(user.id, qrCodeRecord.rarity)
      console.log('Updated leaderboard for user:', user.id)

      // No phase advancement needed in simplified sequential system

      return NextResponse.json({
        success: true,
        scan: {
          id: scanRecord.id,
          tokensEarned: qrCodeRecord.tokenReward.toString(),
          transactionHash: transferResult.transactionHash,
          qrCode: {
            name: qrCodeRecord.name,
            rarity: qrCodeRecord.rarity,
            sequenceOrder: qrCodeRecord.sequenceOrder
          }
        },
        userStats: {
          totalTokens: updatedUser.totalTokens.toString(),
          qrCodesScanned: updatedUser.qrCodesScanned
        }
      })
    } else {
      // Transfer failed - provide detailed error message and don't count as successful scan
      console.log('Transfer failed, not updating user progress:', transferResult.error)
      
      return NextResponse.json({
        success: false,
        error: 'Token transfer failed - scan not counted',
        transferError: transferResult.error,
        message: 'Your QR code scan was valid, but the token transfer failed. Please try scanning again.',
        details: {
          reason: transferResult.error,
          suggestion: 'This could be due to network issues, insufficient treasury balance, or blockchain connectivity problems. Please try again in a moment.'
        },
        scan: {
          id: scanRecord.id,
          tokensEarned: qrCodeRecord.tokenReward.toString(),
          status: 'FAILED',
          qrCode: {
            name: qrCodeRecord.name,
            rarity: qrCodeRecord.rarity,
            sequenceOrder: qrCodeRecord.sequenceOrder
          }
        },
        // Don't provide user stats or progress updates on failed transfers
        userProgress: {
          currentSequence: userRecord.scannedQRs.length, // Keep at current level
          nextQrNeeded: userRecord.scannedQRs.length + 1,
          message: 'Progress not updated due to transfer failure'
        }
      }, { status: 400 }) // Changed from 500 to 400 to indicate client should retry
    }

  } catch (error) {
    console.error('QR scan error:', error)
    return NextResponse.json(
      { error: 'QR scan failed. Please try again.' },
      { status: 500 }
    )
  }
})

async function updateLeaderboard(userId: string, qrRarity: string) {
  const updateData: {
    qrCodesScanned: { increment: number }
    rareQRsScanned?: { increment: number }
    legendaryQRsScanned?: { increment: number }
  } = {
    qrCodesScanned: { increment: 1 }
  }

  if (qrRarity === 'RARE') {
    updateData.rareQRsScanned = { increment: 1 }
  } else if (qrRarity === 'LEGENDARY') {
    updateData.legendaryQRsScanned = { increment: 1 }
  }

  // Get updated user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalTokens: true,
      qrCodesScanned: true,
      lastScannedAt: true
    }
  })

  if (user) {
    await prisma.leaderboardEntry.update({
      where: { userId },
      data: {
        ...updateData,
        totalTokens: user.totalTokens,
        lastScanAt: user.lastScannedAt
      }
    })
  }
}

// Phase advancement function removed - no longer needed in sequential system
