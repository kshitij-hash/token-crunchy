import { NextResponse } from 'next/server'
import { withAuth, checkRateLimit } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'
import { transferTokensToUser } from '../../../../lib/web3/treasury-wallet'

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

    // Find the QR code in database
    const qrCodeRecord = await prisma.qRCode.findUnique({
      where: { 
        code: qrCode,
        isActive: true
      },
      include: {
        hint: true
      }
    })

    if (!qrCodeRecord) {
      return NextResponse.json(
        { error: 'Invalid or inactive QR code' },
        { status: 404 }
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
      return NextResponse.json(
        { error: 'QR code already scanned' },
        { status: 409 }
      )
    }

    // Get user's current progress
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        qrCodesScanned: true,
        scannedQRs: {
          where: {
            userId: user.id
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
    
    if (qrCodeRecord.sequenceOrder !== expectedSequence) {
      return NextResponse.json(
        { 
          error: `Please scan QR codes in order. Expected QR #${expectedSequence}, but got QR #${qrCodeRecord.sequenceOrder}`,
          expectedSequence,
          receivedSequence: qrCodeRecord.sequenceOrder
        },
        { status: 400 }
      )
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
      transferResult = await transferTokensToUser(
        user.walletAddress,
        qrCodeRecord.tokenReward.toString()
      )

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

      // Update leaderboard
      await updateLeaderboard(user.id, qrCodeRecord.rarity)

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
      return NextResponse.json({
        success: false,
        error: 'QR code scanned but token transfer failed',
        scan: {
          id: scanRecord.id,
          tokensEarned: qrCodeRecord.tokenReward.toString(),
          transferError: transferResult.error,
          qrCode: {
            name: qrCodeRecord.name,
            rarity: qrCodeRecord.rarity,
            sequenceOrder: qrCodeRecord.sequenceOrder
          }
        }
      }, { status: 500 })
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
