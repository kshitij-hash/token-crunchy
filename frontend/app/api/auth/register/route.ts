import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { verifyWalletSignature, checkRateLimit } from '../../../../lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkRateLimit(`register:${clientIP}`, 5, 300000) // 5 requests per 5 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { walletAddress, nickname, signature, message } = body

    // Validate required fields
    if (!walletAddress || !nickname || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, nickname, signature, message' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate nickname
    if (nickname.length < 3 || nickname.length > 20) {
      return NextResponse.json(
        { error: 'Nickname must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    // Check for invalid characters in nickname
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      return NextResponse.json(
        { error: 'Nickname can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    // Verify wallet signature
    const signatureResult = await verifyWalletSignature(walletAddress, message, signature)
    
    if (!signatureResult.isValid) {
      return NextResponse.json(
        { error: signatureResult.error || 'Invalid signature' },
        { status: 401 }
      )
    }

    // Check if wallet address already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Wallet address already registered' },
        { status: 409 }
      )
    }

    // Check if nickname already exists
    const existingNickname = await prisma.user.findUnique({
      where: { nickname }
    })

    if (existingNickname) {
      return NextResponse.json(
        { error: 'Nickname already taken' },
        { status: 409 }
      )
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        nickname,
        totalTokens: 0,
        qrCodesScanned: 0
      },
      select: {
        id: true,
        walletAddress: true,
        nickname: true,
        totalTokens: true,
        qrCodesScanned: true,
        createdAt: true
      }
    })

    // Create initial leaderboard entry
    await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        totalTokens: 0,
        qrCodesScanned: 0,
        rareQRsScanned: 0,
        legendaryQRsScanned: 0
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalTokens: user.totalTokens.toString()
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
