"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/retroui/Button';
import { Text } from '@/components/retroui/Text';
import { Card } from '@/components/retroui/Card';

const qrCodes = [
  {
    code: 'MYSTERY_QR_001',
    name: 'First Discovery',
    hint: 'Where visitors first arrive, they probably have more than just room keys',
    sequenceOrder: 1
  },
  {
    code: 'MYSTERY_QR_002', 
    name: 'Hidden Homes',
    hint: 'Those little houses look sus... maybe check em out?',
    sequenceOrder: 2
  },
  {
    code: 'MYSTERY_QR_003',
    name: 'Aquatic Adventure', 
    hint: 'Go splash around the big pool, might find more than chlorine',
    sequenceOrder: 3
  },
  {
    code: 'MYSTERY_QR_004',
    name: 'Hunger Station',
    hint: 'Grab some food and maybe grab something else too',
    sequenceOrder: 4
  },
  {
    code: 'MYSTERY_QR_005',
    name: 'Beat Drop Zone',
    hint: 'Where the beats drop, tokens might drop too (near the big splash)',
    sequenceOrder: 5
  },
  {
    code: 'MYSTERY_QR_006',
    name: 'Central Command',
    hint: 'Where all roads lead...',
    sequenceOrder: 6
  }
];

export default function QRTestPage() {
  const [selectedQR, setSelectedQR] = useState(qrCodes[0]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Text className="text-4xl font-head font-bold text-black mb-4">
            🎯 QR Code Testing Center
          </Text>
          <Text className="text-lg text-muted-foreground">
            Use these QR codes to test your Token Crunchies hunt!
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <Card className="bg-white border-2 border-black shadow-lg p-8">
            <div className="text-center space-y-6">
              <div className="bg-primary border-2 border-black p-4 inline-block">
                <Text className="font-head font-bold text-black text-xl mb-4">
                  {selectedQR.name}
                </Text>
                <div className="bg-white p-4 border-2 border-black inline-block">
                  <QRCodeSVG 
                    value={selectedQR.code}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Text className="font-head font-bold text-black">
                  QR Code: {selectedQR.code}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Sequence: #{selectedQR.sequenceOrder}
                </Text>
              </div>

              <div className="bg-accent/20 border-2 border-dashed border-black p-4">
                <Text className="font-head font-bold text-black mb-2">
                  📍 Expected Hint:
                </Text>
                <Text className="text-black">
                  &ldquo;{selectedQR.hint}&rdquo;
                </Text>
              </div>
            </div>
          </Card>

          {/* QR Code Selection */}
          <div className="space-y-4">
            <Text className="text-2xl font-head font-bold text-black mb-4">
              Select QR Code to Display:
            </Text>
            
            {qrCodes.map((qr) => (
              <Button
                key={qr.code}
                onClick={() => setSelectedQR(qr)}
                variant={selectedQR.code === qr.code ? "default" : "outline"}
                className="w-full justify-start text-left p-4 h-auto"
              >
                <div>
                  <div className="font-head font-bold">
                    #{qr.sequenceOrder} - {qr.name}
                  </div>
                  <div className="text-sm opacity-70 mt-1">
                    {qr.code}
                  </div>
                </div>
              </Button>
            ))}

            <Card className="bg-primary border-2 border-black shadow-md p-6 mt-8">
              <Text className="font-head font-bold text-black text-lg mb-4">
                🧪 Testing Instructions:
              </Text>
              <div className="space-y-2 text-black">
                <Text className="text-sm">
                  1. Select a QR code from the list above
                </Text>
                <Text className="text-sm">
                  2. Display the QR code on this screen
                </Text>
                <Text className="text-sm">
                  3. Use another device to scan it with your app
                </Text>
                <Text className="text-sm">
                  4. Verify the hint appears correctly
                </Text>
                <Text className="text-sm">
                  5. Test the token reward system
                </Text>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.location.href = '/'}
            variant="secondary"
          >
            ← Back to Main App
          </Button>
        </div>
      </div>
    </div>
  );
}
