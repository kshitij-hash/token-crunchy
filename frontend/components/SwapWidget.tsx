'use client'

import { useState, useEffect } from 'react'
import { useSwap } from '../hooks/useSwap'
import { WORKING_TOKENS } from '../lib/services/swap-service'

interface SwapOpportunity {
  id: string
  expiresAt: string
  qrScan: {
    tokensEarned: string
    qrCode: {
      name: string
      rarity: string
    }
  }
}

export function SwapWidget({ opportunityId }: { opportunityId?: string }) {
  const [sellAmount, setSellAmount] = useState('')
  const [sellToken, setSellToken] = useState('WMON')
  const [buyToken, setBuyToken] = useState('USDT')
  const [opportunities, setOpportunities] = useState<SwapOpportunity[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Auto-update buy token when sell token changes to avoid same token error
  const handleSellTokenChange = (newSellToken: string) => {
    setSellToken(newSellToken)
    
    // If the new sell token is the same as buy token, switch buy token
    if (newSellToken === buyToken) {
      const availableTokens = Object.keys(WORKING_TOKENS).filter(token => token !== newSellToken)
      if (availableTokens.length > 0) {
        setBuyToken(availableTokens[0])
      }
    }
  }

  // Swap the sell and buy tokens
  const handleSwapTokens = () => {
    const tempSellToken = sellToken
    setSellToken(buyToken)
    setBuyToken(tempSellToken)
    setSellAmount('') // Clear amount when swapping
  }

  const { executeSwap, isLoading, error, isSuccess, data } = useSwap()

  // Fetch user's swap opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/swap/opportunities', {
          headers: {
            'x-wallet-address': window.ethereum?.selectedAddress?.toLowerCase() || ''
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          setOpportunities(result.opportunities || [])
          if (result.opportunities?.length > 0) {
            setSelectedOpportunity(result.opportunities[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch opportunities:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const opportunityToUse = opportunityId || selectedOpportunity
    if (!opportunityToUse) {
      alert('No swap opportunity available. Scan a QR code first!')
      return
    }

    try {
      const result = await executeSwap({
        sellToken,
        buyToken,
        sellAmount,
        opportunityId: opportunityToUse
      })
      console.log('Swap successful:', result)
    } catch (err) {
      console.error('Swap error:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="text-center text-gray-500">Loading swap opportunities...</div>
      </div>
    )
  }

  if (opportunities.length === 0 && !opportunityId) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Token Swap</h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p className="mb-2">No swap opportunities available</p>
          <p className="text-sm">Scan QR codes to earn swap opportunities!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Swap Tokens</h3>

      {/* Opportunity Selection */}
      {!opportunityId && opportunities.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Swap Opportunity</label>
          <select
            value={selectedOpportunity}
            onChange={(e) => setSelectedOpportunity(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                From {opp.qrScan.qrCode.name} ({opp.qrScan.tokensEarned} tokens earned)
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error.message}
        </div>
      )}

      {isSuccess && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          Swap successful! Transaction: {data?.transactionHash}
        </div>
      )}

      <form onSubmit={handleSwap} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sell</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="0.0"
            />
            <select
              value={sellToken}
              onChange={(e) => handleSellTokenChange(e.target.value)}
              className="p-2 border rounded"
            >
              {Object.keys(WORKING_TOKENS).map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap tokens button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwapTokens}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Swap tokens"
          >
            ↕️
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Buy</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={buyToken}
              readOnly
              className="flex-1 p-2 border rounded bg-gray-100"
            />
            <select
              value={buyToken}
              onChange={(e) => setBuyToken(e.target.value)}
              className="p-2 border rounded"
            >
              {Object.keys(WORKING_TOKENS)
                .filter((token) => token !== sellToken)
                .map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || (!opportunityId && !selectedOpportunity)}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </form>
    </div>
  )
}
