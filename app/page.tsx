"use client";

import { Button } from "@/components/retroui/Button";
import { QRScanner } from "@/components/QRScanner";
import { ProgressTracker } from "@/components/ProgressTracker";
import { GameRules } from "@/components/GameRules";
import { WalletConnect } from "@/components/WalletConnect";
import { useState, useEffect } from "react";
import { Coins } from "lucide-react";

interface ScannedQR {
  id: number;
  timestamp: Date;
  location?: string;
}

export default function Home() {
  const [scannedQRs, setScannedQRs] = useState<ScannedQR[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [totalCrunchies, setTotalCrunchies] = useState(0);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("athena-qr-progress");
    if (saved) {
      const data = JSON.parse(saved);
      setScannedQRs(data.scannedQRs || []);
      setTotalCrunchies(data.totalCrunchies || 0);
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(
      "athena-qr-progress",
      JSON.stringify({
        scannedQRs,
        totalCrunchies,
      })
    );
  }, [scannedQRs, totalCrunchies]);

  const handleQRScanned = (qrId: number) => {
    const nextExpected = scannedQRs.length + 1;

    if (qrId !== nextExpected) {
      alert(
        `You must scan QR codes in sequence! Next expected: #${nextExpected}`
      );
      return;
    }

    const newQR: ScannedQR = {
      id: qrId,
      timestamp: new Date(),
    };

    setScannedQRs((prev) => [...prev, newQR]);
    setTotalCrunchies((prev) => prev + 50); // 50 $crunchies per QR
    setShowScanner(false);

    // Celebration for completing all QRs
    if (qrId === 20) {
      setTotalCrunchies((prev) => prev + 500); // Bonus for completion
      alert(
        "🎉 Congratulations! You've found all 20 QR codes! Bonus 500 $crunchies awarded!"
      );
    }
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to reset all progress?")) {
      setScannedQRs([]);
      setTotalCrunchies(0);
      localStorage.removeItem("athena-qr-progress");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Athena QR Hunt
          </h1>
          <p className="text-gray-600">
            Find 20 QR codes around the villa and earn $crunchies
          </p>
        </div>

        {/* Wallet & Stats */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-center">
          <WalletConnect
            connected={walletConnected}
            onConnect={setWalletConnected}
          />
          <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2">
            <Coins className="w-5 h-5 text-gray-600" />
            <span className="font-semibold">{totalCrunchies} $crunchies</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <ProgressTracker scannedQRs={scannedQRs} />
        </div>

        {/* Main Action Area */}
        <div className="text-center mb-8">
          {!showScanner ? (
            <div className="space-y-4">
              <Button size="lg" onClick={() => setShowScanner(true)}>
                {scannedQRs.length === 0
                  ? "Start QR Hunt"
                  : `Scan QR #${scannedQRs.length + 1}`}
              </Button>
              {scannedQRs.length > 0 && (
                <Button
                  variant="outline"
                  onClick={resetProgress}
                  className="ml-4"
                >
                  Reset Progress
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <QRScanner
                onQRScanned={handleQRScanned}
                expectedQR={scannedQRs.length + 1}
              />
              <Button variant="secondary" onClick={() => setShowScanner(false)}>
                Close Scanner
              </Button>
            </div>
          )}
        </div>

        {/* Game Rules */}
        <GameRules />

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Built for Athena Hackerhouse • Powered by Monad Testnet</p>
        </div>
      </div>
    </div>
  );
}
