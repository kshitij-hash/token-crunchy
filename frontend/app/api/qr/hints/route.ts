import { NextResponse } from 'next/server'
import { withAuth } from '../../../../lib/middleware/auth'
import { prisma } from '../../../../lib/prisma'

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const phase = searchParams.get('phase') || user.currentPhase

    // Validate phase parameter
    const validPhases = ['PHASE_1', 'PHASE_2', 'PHASE_3']
    if (!validPhases.includes(phase)) {
      return NextResponse.json(
        { error: 'Invalid phase parameter' },
        { status: 400 }
      )
    }

    // Users can only see hints for their current phase or previous phases
    const userPhaseOrder = { 'PHASE_1': 1, 'PHASE_2': 2, 'PHASE_3': 3 }
    const requestedPhaseOrder = userPhaseOrder[phase as keyof typeof userPhaseOrder]
    const currentPhaseOrder = userPhaseOrder[user.currentPhase as keyof typeof userPhaseOrder]

    if (requestedPhaseOrder > currentPhaseOrder) {
      return NextResponse.json(
        { error: 'Cannot access hints for future phases' },
        { status: 403 }
      )
    }

    // Get user's scanned QRs in the requested phase
    const userScans = await prisma.userQRScan.findMany({
      where: {
        userId: user.id,
        qrCode: {
          phase: phase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3'
        }
      },
      select: {
        qrCodeId: true
      }
    })

    const scannedQRIds = userScans.map(scan => scan.qrCodeId)

    // Get QR codes with hints for the requested phase
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        phase: phase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        sequenceOrder: true,
        rarity: true,
        tokenReward: true,
        hint: {
          select: {
            title: true,
            content: true
          }
        }
      },
      orderBy: {
        sequenceOrder: 'asc'
      }
    })

    // Determine which hints to show based on game rules
    const hintsToShow = qrCodes.map(qr => {
      const isScanned = scannedQRIds.includes(qr.id)
      const shouldShowHint = determineHintVisibility(qr, phase, isScanned, scannedQRIds.length)

      return {
        id: qr.id,
        name: qr.name,
        description: qr.description,
        sequenceOrder: qr.sequenceOrder,
        rarity: qr.rarity,
        tokenReward: qr.tokenReward.toString(),
        isScanned,
        hint: shouldShowHint && qr.hint ? {
          title: qr.hint.title,
          content: qr.hint.content
        } : null,
        hintAvailable: !!qr.hint,
        hintLocked: !shouldShowHint
      }
    })

    // Get phase progress
    const totalQRsInPhase = qrCodes.length
    const scannedQRsInPhase = scannedQRIds.length

    return NextResponse.json({
      success: true,
      phase,
      hints: hintsToShow,
      progress: {
        total: totalQRsInPhase,
        scanned: scannedQRsInPhase,
        percentage: totalQRsInPhase > 0 ? (scannedQRsInPhase / totalQRsInPhase) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Hints fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hints' },
      { status: 500 }
    )
  }
})

function determineHintVisibility(
  qr: { sequenceOrder: number },
  phase: string,
  isScanned: boolean,
  totalScannedInPhase: number
): boolean {
  // Always show hints for already scanned QRs
  if (isScanned) {
    return true
  }

  // Phase-specific hint visibility rules
  switch (phase) {
    case 'PHASE_1':
      // Show hint for next QR in sequence (sequential scanning)
      return qr.sequenceOrder === totalScannedInPhase + 1
      
    case 'PHASE_2':
      // Show all hints for rare QRs (non-sequential)
      return true
      
    case 'PHASE_3':
      // Legendary QR hint only shown at specific times/events
      // For now, always show if user reached this phase
      return true
      
    default:
      return false
  }
}

// Get specific hint by QR ID (for authenticated users)
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json()
    const { qrId } = body

    if (!qrId) {
      return NextResponse.json(
        { error: 'QR ID is required' },
        { status: 400 }
      )
    }

    // Get QR code with hint
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        id: qrId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        phase: true,
        sequenceOrder: true,
        rarity: true,
        tokenReward: true,
        hint: {
          select: {
            title: true,
            content: true
          }
        }
      }
    })

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      )
    }

    // Check if user can access this hint
    const userPhaseOrder = { 'PHASE_1': 1, 'PHASE_2': 2, 'PHASE_3': 3 }
    const qrPhaseOrder = userPhaseOrder[qrCode.phase as keyof typeof userPhaseOrder]
    const currentPhaseOrder = userPhaseOrder[user.currentPhase as keyof typeof userPhaseOrder]

    if (qrPhaseOrder > currentPhaseOrder) {
      return NextResponse.json(
        { error: 'Cannot access hints for future phases' },
        { status: 403 }
      )
    }

    // Check if user has already scanned this QR
    const existingScan = await prisma.userQRScan.findUnique({
      where: {
        userId_qrCodeId: {
          userId: user.id,
          qrCodeId: qrCode.id
        }
      }
    })

    const isScanned = !!existingScan

    // Get user's progress in this phase
    const scannedInPhase = await prisma.userQRScan.count({
      where: {
        userId: user.id,
        qrCode: {
          phase: qrCode.phase as 'PHASE_1' | 'PHASE_2' | 'PHASE_3'
        }
      }
    })

    const shouldShowHint = determineHintVisibility(qrCode, qrCode.phase, isScanned, scannedInPhase)

    if (!shouldShowHint) {
      return NextResponse.json(
        { error: 'Hint not available yet' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        description: qrCode.description,
        phase: qrCode.phase,
        sequenceOrder: qrCode.sequenceOrder,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        isScanned,
        hint: qrCode.hint
      }
    })

  } catch (error) {
    console.error('Specific hint fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hint' },
      { status: 500 }
    )
  }
})
