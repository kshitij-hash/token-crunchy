"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Trophy, Coins, AlertTriangle } from "lucide-react";
import { Button } from "@/components/retroui/Button";

export function GameRules() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div 
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gray-600" />
          Game Rules & Info
        </h3>
        <Button variant="outline" size="sm" className="p-2">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-6">
          {/* How to Play */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              How to Play
            </h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">1.</span>
                <span>Find QR codes hidden around the Athena Hackerhouse villa</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">2.</span>
                <span>Scan them in sequential order (1, 2, 3... up to 20)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">3.</span>
                <span>Earn 50 $crunchies for each QR code you find</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">4.</span>
                <span>Complete all 20 for a 500 $crunchies bonus!</span>
              </li>
            </ul>
          </div>

          {/* Important Rules */}
          <div>
            <h4 className="text-base font-semibold text-red-600 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Important Rules
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-red-700 font-medium">
                ⚠️ You MUST scan QR codes in order!
              </p>
              <p className="text-gray-700 text-sm">
                You cannot scan QR #10 before scanning QR #9. The app will reject out-of-order scans.
              </p>
            </div>
          </div>

          {/* Rewards */}
          <div>
            <h4 className="text-base font-semibold text-green-600 mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              $crunchies Rewards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-xl font-bold text-green-600 mb-1">50 $crunchies</div>
                <div className="text-gray-600 text-sm">Per QR code scanned</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-xl font-bold text-blue-600 mb-1">500 $crunchies</div>
                <div className="text-gray-600 text-sm">Completion bonus</div>
              </div>
            </div>
          </div>

          {/* What You Can Buy */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              What You Can Buy with $crunchies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <div className="text-lg mb-1">🥤</div>
                <div className="text-gray-700 text-sm">Red Bull & Energy Drinks</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <div className="text-lg mb-1">🍺</div>
                <div className="text-gray-700 text-sm">Booze & Cocktails</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <div className="text-lg mb-1">🍿</div>
                <div className="text-gray-700 text-sm">Crunchies & Snacks</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              Pro Tips
            </h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>QR codes are hidden in creative spots around the villa</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>Check common areas, outdoor spaces, and unexpected locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>Your progress is automatically saved</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>Connect your wallet to receive $crunchies airdrops on Monad testnet</span>
              </li>
            </ul>
          </div>

          {/* Technical Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Built for Athena Hackerhouse • Powered by Monad Testnet • Using RetroUI Components
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
