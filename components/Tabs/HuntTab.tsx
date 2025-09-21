"use client";

import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";
import { Button } from "../retroui/Button";
import { UserProfile } from "@/lib/api-client";
import { getPhaseDisplayName, getRarityEmoji } from "@/lib/api-client";
import { Trophy } from "lucide-react";

interface HuntTabProps {
  scannedQRs: UserProfile['scannedQRs'];
  onScanQR: () => void;
  userProfile: UserProfile | null;
}

export function HuntTab({ onScanQR, userProfile }: HuntTabProps) {
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-4xl">🔍</div>
        <Text className="text-gray-600 text-center">Loading your hunt progress...</Text>
      </div>
    );
  }

  const { phaseProgress } = userProfile;

  return (
    <div className="space-y-6">
      {/* Current Phase Card */}
      <Card className="bg-white border-black rounded-lg w-full">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {getPhaseDisplayName(userProfile.currentPhase)}
          </Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          {/* Progress will be shown via phase progress info */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Text className="text-sm text-gray-600">
              Progress: {userProfile.qrCodesScanned} QRs found in {getPhaseDisplayName(userProfile.currentPhase)}
            </Text>
          </div>
          
          {/* Next QR Hint */}
          {phaseProgress.nextQR && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getRarityEmoji(phaseProgress.nextQR.rarity)}</span>
                <div>
                  <Text className="font-semibold text-blue-800 mb-1">
                    Next: {phaseProgress.nextQR.name}
                  </Text>
                  {phaseProgress.nextQR.hint && (
                    <Text className="text-sm text-blue-600">
                      💡 {phaseProgress.nextQR.hint.content}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phase Complete */}
          {phaseProgress.isPhaseComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <Text className="font-semibold text-green-800 mb-1">
                Phase Complete!
              </Text>
              <Text className="text-sm text-green-600">
                You&apos;ve found all QR codes in this phase. Great job!
              </Text>
            </div>
          )}
          
          <Button 
            onClick={onScanQR} 
            className="w-full"
            disabled={phaseProgress.isPhaseComplete && userProfile.currentPhase === 'PHASE_3'}
          >
            {phaseProgress.isPhaseComplete && userProfile.currentPhase === 'PHASE_3' 
              ? 'Hunt Complete!' 
              : 'Scan QR Code'
            }
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
