"use client";

import { useState } from "react";
import { Wallet, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/retroui/Button";

interface WalletConnectProps {
  connected: boolean;
  onConnect: (connected: boolean) => void;
}

export function WalletConnect({ connected, onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection (in production, use actual wallet integration)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock wallet address for demo
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40);
      setWalletAddress(mockAddress);
      onConnect(true);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    onConnect(false);
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connected && walletAddress) {
    return (
      <div className="bg-white border rounded-lg px-4 py-2 flex items-center gap-3">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <div className="flex flex-col">
          <span className="text-green-600 text-sm font-medium">Connected to Monad</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs font-mono">
              {formatAddress(walletAddress)}
            </span>
            <button
              onClick={copyAddress}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      
      <div className="text-center">
        <p className="text-gray-600 text-sm mb-1">
          Connect your wallet to receive $crunchies
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>Powered by</span>
          <a 
            href="https://monad.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 flex items-center gap-1"
          >
            Monad Testnet
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-sm">
        <div className="text-center">
          <h4 className="text-blue-600 font-medium text-sm mb-2">Why Connect?</h4>
          <ul className="text-gray-700 text-xs space-y-1">
            <li>• Receive $crunchies airdrops automatically</li>
            <li>• Track your token balance on Monad testnet</li>
            <li>• Use tokens for villa purchases</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
