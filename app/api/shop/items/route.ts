import { NextResponse } from 'next/server'
import { withAuth } from '../../../../lib/middleware/auth'

// Mock shop items for now - in production this would come from a database
const SHOP_ITEMS = [
  {
    id: 'sticker-pack-1',
    name: 'Token Crunchies Sticker Pack',
    description: 'Exclusive sticker pack with rare Token Crunchies designs',
    price: '100',
    category: 'collectibles',
    image: '/shop/sticker-pack-1.jpg',
    inStock: true,
    maxQuantity: 5,
    rarity: 'NORMAL'
  },
  {
    id: 'tshirt-rare',
    name: 'Limited Edition T-Shirt',
    description: 'Rare Token Crunchies t-shirt with holographic print',
    price: '500',
    category: 'apparel',
    image: '/shop/tshirt-rare.jpg',
    inStock: true,
    maxQuantity: 2,
    rarity: 'RARE'
  },
  {
    id: 'nft-legendary',
    name: 'Legendary NFT Badge',
    description: 'Ultra-rare NFT badge for completing all phases',
    price: '1000',
    category: 'digital',
    image: '/shop/nft-legendary.jpg',
    inStock: true,
    maxQuantity: 1,
    rarity: 'LEGENDARY',
    requirements: {
      minPhase: 'PHASE_3',
      minQRsScanned: 13
    }
  },
  {
    id: 'keychain-normal',
    name: 'Token Crunchies Keychain',
    description: 'Cute keychain with Token Crunchies mascot',
    price: '50',
    category: 'accessories',
    image: '/shop/keychain-normal.jpg',
    inStock: true,
    maxQuantity: 10,
    rarity: 'NORMAL'
  },
  {
    id: 'poster-rare',
    name: 'Rare Event Poster',
    description: 'Limited edition poster from the Token Crunchies launch event',
    price: '250',
    category: 'collectibles',
    image: '/shop/poster-rare.jpg',
    inStock: false, // Out of stock
    maxQuantity: 3,
    rarity: 'RARE'
  }
]

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const inStockOnly = searchParams.get('inStock') === 'true'

    // Get user's current stats to check item requirements
    const userStats = await getUserStats(user.id)

    // Filter items based on query parameters
    let filteredItems = SHOP_ITEMS

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category)
    }

    if (inStockOnly) {
      filteredItems = filteredItems.filter(item => item.inStock)
    }

    // Add availability and requirement checks for each item
    const itemsWithAvailability = filteredItems.map(item => {
      const meetsRequirements = checkItemRequirements(item, userStats)
      const canAfford = parseFloat(userStats.totalTokens) >= parseFloat(item.price)

      return {
        ...item,
        available: item.inStock && meetsRequirements && canAfford,
        canAfford,
        meetsRequirements,
        requirementMessage: getRequirementMessage(item, userStats)
      }
    })

    // Get available categories
    const categories = [...new Set(SHOP_ITEMS.map(item => item.category))]

    return NextResponse.json({
      success: true,
      items: itemsWithAvailability,
      categories,
      userStats: {
        totalTokens: userStats.totalTokens,
        currentPhase: userStats.currentPhase,
        qrCodesScanned: userStats.qrCodesScanned
      }
    })

  } catch (error) {
    console.error('Shop items fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop items' },
      { status: 500 }
    )
  }
})

async function getUserStats(_userId: string) {
  // In a real implementation, this would fetch from the database
  // For now, return mock data - you would integrate with your user system
  return {
    totalTokens: '750', // This should come from the database
    currentPhase: 'PHASE_2',
    qrCodesScanned: 10
  }
}

function checkItemRequirements(item: { requirements?: { minPhase?: string; minQRsScanned?: number } }, userStats: { currentPhase: string; qrCodesScanned: number }): boolean {
  if (!item.requirements) {
    return true
  }

  const { minPhase, minQRsScanned } = item.requirements

  if (minPhase) {
    const phaseOrder = { 'PHASE_1': 1, 'PHASE_2': 2, 'PHASE_3': 3 }
    const userPhaseOrder = phaseOrder[userStats.currentPhase as keyof typeof phaseOrder] || 0
    const requiredPhaseOrder = phaseOrder[minPhase as keyof typeof phaseOrder] || 0
    
    if (userPhaseOrder < requiredPhaseOrder) {
      return false
    }
  }

  if (minQRsScanned && userStats.qrCodesScanned < minQRsScanned) {
    return false
  }

  return true
}

function getRequirementMessage(item: { requirements?: { minPhase?: string; minQRsScanned?: number } }, userStats: { currentPhase: string; qrCodesScanned: number }): string | null {
  if (!item.requirements) {
    return null
  }

  const { minPhase, minQRsScanned } = item.requirements
  const messages: string[] = []

  if (minPhase) {
    const phaseOrder = { 'PHASE_1': 1, 'PHASE_2': 2, 'PHASE_3': 3 }
    const userPhaseOrder = phaseOrder[userStats.currentPhase as keyof typeof phaseOrder] || 0
    const requiredPhaseOrder = phaseOrder[minPhase as keyof typeof phaseOrder] || 0
    
    if (userPhaseOrder < requiredPhaseOrder) {
      messages.push(`Requires ${minPhase}`)
    }
  }

  if (minQRsScanned && userStats.qrCodesScanned < minQRsScanned) {
    messages.push(`Requires ${minQRsScanned} QR codes scanned`)
  }

  return messages.length > 0 ? messages.join(', ') : null
}
