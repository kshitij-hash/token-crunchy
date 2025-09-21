"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { LoginPage } from "@/components/LoginPage";
import { QRScanner } from "@/components/Tabs/QRScanner";
import { TabNavigation } from "@/components/Tabs/TabNavigation";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Info, User } from "lucide-react";
import { Dialog } from "@/components/retroui/Dialog";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { Loader } from "@/components/retroui/Loader";
import { LeaderboardTab } from "@/components/Tabs/LeaderboardTab";
import { ShopTab } from "@/components/Tabs/ShopTab";
import { HuntTab } from "@/components/Tabs/HuntTab";
import { useAuth } from "@/hooks/useAuth";
import { formatTokens, getPhaseDisplayName } from "@/lib/api-client";

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
  const [showScanner, setShowScanner] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "shop" | "leaderboard">("home");
  
  const { isConnected } = useAccount();
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    user, 
    error: authError,
    refreshProfile 
  } = useAuth();

  // Show registration modal for connected but unregistered users
  useEffect(() => {
    if (isConnected && !authLoading && !isAuthenticated && !authError) {
      setShowRegistration(true);
    } else {
      setShowRegistration(false);
    }
  }, [isConnected, authLoading, isAuthenticated, authError]);

  const handleQRScanned = (qrCode: string) => {
    console.log('QR scanned:', qrCode); // Log for debugging
    setShowScanner(false);
    // Refresh user profile to get updated stats
    refreshProfile();
  };

  const handlePurchase = (item: ShopItem) => {
    console.log('Purchase attempted:', item.name); // Log for debugging
    alert(`Purchase functionality will be implemented with backend integration`);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    // Profile will be automatically loaded by the auth hook
  };

  // Show login page if wallet is not connected
  if (!isConnected) {
    return <LoginPage />;
  }

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader size="lg" count={3} />
          <Text className="text-gray-600">Loading your profile...</Text>
        </div>
      </div>
    );
  }

  // Show QR Scanner modal
  if (showScanner && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QRScanner
          onQRScanned={handleQRScanned}
          expectedQR={user?.phaseProgress?.nextQR?.sequenceOrder || 1}
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
          <div className="flex items-center gap-3">
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
                          scan the codes and instantly earn tokens.
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
                          real rewards!
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
            
            {/* User Profile Button */}
            {isAuthenticated && user && (
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.nickname}</span>
              </Button>
            )}
          </div>
          
          <ConnectKitButton showAvatar={false} />
        </div>

        {/* User Stats Bar */}
        {isAuthenticated && user && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-600">💰</span>
                <Text className="font-semibold">{formatTokens(user.totalTokens)} tokens</Text>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600">📱</span>
                <Text>{user.qrCodesScanned} QRs found</Text>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-600">🎯</span>
                <Text className="text-xs">{getPhaseDisplayName(user.currentPhase)}</Text>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {activeTab === "home" && isAuthenticated && (
            <HuntTab
              scannedQRs={user?.scannedQRs || []}
              onScanQR={() => setShowScanner(true)}
              userProfile={user}
            />
          )}
          {activeTab === "shop" && isAuthenticated && (
            <ShopTab
              totalCrunchies={parseFloat(user?.totalTokens || '0')}
              onPurchase={handlePurchase}
              userProfile={user}
            />
          )}
          {activeTab === "leaderboard" && (
            <LeaderboardTab currentUserAddress={user?.walletAddress} />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
