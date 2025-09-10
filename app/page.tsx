"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { LoginPage } from "@/components/LoginPage";
import { QRScanner } from "@/components/Tabs/QRScanner";
import { TabNavigation } from "@/components/Tabs/TabNavigation";
import { Info } from "lucide-react";
import { Dialog } from "@/components/retroui/Dialog";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { LeaderboardTab } from "@/components/Tabs/LeaderboardTab";
import { ShopTab } from "@/components/Tabs/ShopTab";
import { HuntTab } from "@/components/Tabs/HuntTab";

interface ScannedQR {
  id: number;
  timestamp: Date;
  location?: string;
}

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: "snack" | "drink";
  emoji: string;
  description: string;
  inStock: boolean;
}

export default function Home() {
  const [scannedQRs, setScannedQRs] = useState<ScannedQR[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [totalCrunchies, setTotalCrunchies] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "shop" | "leaderboard">(
    "home"
  );
  const { address, isConnected } = useAccount();

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("athena-qr-progress");
    if (saved) {
      const data = JSON.parse(saved);
      setScannedQRs(data.scannedQRs || []);
      setTotalCrunchies(data.totalCrunchies || 0);
    }
  }, []);

  // Save progress
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

  const handlePurchase = (item: ShopItem) => {
    if (totalCrunchies >= item.price) {
      setTotalCrunchies((prev) => prev - item.price);
      alert(`🎉 Successfully purchased ${item.name}! Enjoy your ${item.emoji}`);
    } else {
      alert("Insufficient $crunchies!");
    }
  };

  // Show login page if wallet is not connected
  if (!isConnected) {
    return <LoginPage />;
  }

  // Show QR Scanner modal
  if (showScanner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QRScanner
          onQRScanned={handleQRScanned}
          expectedQR={scannedQRs.length + 1}
          onClose={() => setShowScanner(false)}
        />
      </div>
    );
  }

  // Main App View - Tab-based navigation
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <Dialog>
            <Dialog.Trigger asChild>
              <Button size="icon" className="rounded-full">
                <Info className="w-5 h-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Content
              size="md"
              className="bg-white border-2 border-black rounded-lg"
            >
              <Dialog.Header className="bg-white text-black border-b-2 border-black">
                <Text as="h3">How to Play</Text>
              </Dialog.Header>
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🕵️‍♂️</span>
                    <div>
                      <Text as="h4" className="font-semibold text-black mb-1">
                        Explore & Find
                      </Text>
                      <Text>
                        Hunt for special QR codes hidden around the event venue.
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📲</span>
                    <div>
                      <Text as="h4" className="font-semibold text-black mb-1">
                        Scan & Earn
                      </Text>
                      <Text>
                        Use the &quot;Scan QR&quot; button on the Home screen to
                        scan the codes and instantly earn $crunchies tokens.
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🥤</span>
                    <div>
                      <Text as="h4" className="font-semibold text-black mb-1">
                        Redeem & Enjoy
                      </Text>
                      <Text>
                        Go to the &quot;Shop&quot; tab to use your tokens for
                        real-life snacks and drinks!
                      </Text>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-2 border-black rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <Text as="h4" className="font-semibold text-black mb-1">
                          Pro-Tip
                        </Text>
                        <Text>
                          Keep an eye on the &quot;Leaderboard&quot; to see how
                          you stack up against other participants.
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog>
          <ConnectKitButton showAvatar={false} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {activeTab === "home" && (
            <HuntTab
              scannedQRs={scannedQRs}
              onScanQR={() => setShowScanner(true)}
            />
          )}
          {activeTab === "shop" && (
            <ShopTab
              totalCrunchies={totalCrunchies}
              onPurchase={handlePurchase}
            />
          )}
          {activeTab === "leaderboard" && (
            <LeaderboardTab currentUserAddress={address} />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
