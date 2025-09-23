import React, { useEffect, useState } from 'react'
import { PrismaClient } from '../../lib/generated/prisma'
import { generateQRCode } from '../../lib/qr-generator'

interface QRCodeImage {
  id: string
  code: string
  name: string
  phase: string
  sequenceOrder: number
  rarity: string
  tokenReward: string
  imageUrl: string
  hint?: {
    title: string
    content: string
  }
}

interface QRCodeData {
  codes: Array<{
    code: string
    name: string
    phase: string
    sequenceOrder: number
    rarity: string
    tokenReward: string
    hint?: {
      title: string
      content: string
    }
    filename: string
  }>
}

const rarityColors = {
  NORMAL: 'bg-blue-100 text-blue-800',
  RARE: 'bg-purple-100 text-purple-800',
  LEGENDARY: 'bg-orange-100 text-orange-800'
}

const phaseColors = {
  PHASE_1: 'border-blue-200',
  PHASE_2: 'border-purple-200',
  PHASE_3: 'border-orange-200'
}

export default function QRCodeManager() {
  const [qrCodes, setQrCodes] = useState<QRCodeImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState<string>('all')

  useEffect(() => {
    loadQRCodes()
  }, [])

  const loadQRCodes = async () => {
    try {
      const response = await fetch('/generated-qr-codes/qr-codes-manifest.json')
      const manifest: QRCodeData = await response.json()

      const qrImages: QRCodeImage[] = manifest.codes.map((code) => ({
        id: code.code,
        code: code.code,
        name: code.name,
        phase: code.phase,
        sequenceOrder: code.sequenceOrder,
        rarity: code.rarity,
        tokenReward: code.tokenReward,
        imageUrl: `/generated-qr-codes/png/${code.filename}.png`,
        hint: code.hint
      }))

      setQrCodes(qrImages)
    } catch (error) {
      console.error('Failed to load QR codes:', error)
      setQrCodes([])
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = (qrCode: QRCodeImage, format: 'png' | 'svg') => {
    const link = document.createElement('a')
    link.href = `/generated-qr-codes/${format}/${qrCode.code.toLowerCase()}_${qrCode.phase.toLowerCase()}_seq${qrCode.sequenceOrder.toString().padStart(2, '0')}.${format}`
    link.download = `${qrCode.name.replace(/\s+/g, '_')}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredQRCodes = qrCodes.filter(qr =>
    selectedPhase === 'all' || qr.phase === selectedPhase
  )

  const phases = ['all', ...Array.from(new Set(qrCodes.map(qr => qr.phase)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">No QR Codes Found</h3>
        <p className="text-gray-500 mb-6">
          Generate QR code images first by running:
        </p>
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
          npm run qr:images
        </div>
        <p className="text-gray-500 mt-4">
          This will create printable QR codes in the generated-qr-codes/ directory
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPhase === phase
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {phase === 'all' ? 'All Phases' : phase.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredQRCodes.map((qrCode) => (
          <div
            key={qrCode.id}
            className={`bg-white rounded-lg shadow-md p-6 border-2 ${phaseColors[qrCode.phase as keyof typeof phaseColors] || 'border-gray-200'}`}
          >
            <div className="text-center mb-4">
              <img
                src={qrCode.imageUrl}
                alt={qrCode.name}
                className="w-32 h-32 mx-auto border-2 border-gray-200 rounded"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-center">
                {qrCode.name}
              </h3>

              <div className="text-center">
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {qrCode.code}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Phase: {qrCode.phase.replace('_', ' ')}</span>
                <span>Seq: #{qrCode.sequenceOrder}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {qrCode.tokenReward} tokens
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${rarityColors[qrCode.rarity as keyof typeof rarityColors] || 'bg-gray-100'}`}>
                  {qrCode.rarity}
                </span>
              </div>

              {qrCode.hint && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 mb-1">
                      {qrCode.hint.title}
                    </div>
                    <div className="text-blue-700">
                      {qrCode.hint.content}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => downloadQRCode(qrCode, 'png')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors"
                >
                  PNG
                </button>
                <button
                  onClick={() => downloadQRCode(qrCode, 'svg')}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors"
                >
                  SVG
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQRCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No QR codes found for {selectedPhase === 'all' ? 'any phase' : selectedPhase.replace('_', ' ')}
        </div>
      )}
    </div>
  )
}
