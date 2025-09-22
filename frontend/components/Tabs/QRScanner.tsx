"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, X, CheckCircle, Coins } from "lucide-react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { formatTokens, getRarityEmoji } from "@/lib/api-client";

interface QRScannerProps {
  onQRScanned: (qrCode: string) => void;
  expectedQR: number;
  onClose: () => void;
}

type ScanState = "scanning" | "verifying" | "success" | "error";

export function QRScanner({
  onQRScanned,
  expectedQR,
  onClose,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  
  const {
    isProcessing,
    result: scanResult,
    error: scanError,
    processQRCode,
    clearResult
  } = useQRScanner();

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (err) {
      setError(
        "Camera access denied. Please allow camera permissions and try again."
      );
      console.error("Camera error:", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    // For demo purposes, use prompt. In production, this would use a QR code library
    const qrCode = prompt(
      `Scan QR Code\n\nFor demo: Enter the QR code (e.g., PHASE1_QR_01):`
    );

    if (qrCode && qrCode.trim()) {
      // Step 1: Show verifying state
      setScanState("verifying");
      setError("");

      try {
        // Process QR code with backend
        const result = await processQRCode(qrCode.trim());

        if (result.success && result.result) {
          // Step 2: Show success state
          setScanState("success");

          // Step 3: Auto-navigate back after showing success
          setTimeout(() => {
            onQRScanned(qrCode.trim());
            onClose();
            clearResult();
          }, 4000);
        } else {
          // Show error state
          setScanState("error");
          setError(result.error || scanError || "QR scan failed");
          
          setTimeout(() => {
            setScanState("scanning");
            setError("");
          }, 3000);
        }
      } catch (error) {
        setScanState("error");
        setError(error instanceof Error ? error.message : "QR scan failed");
        
        setTimeout(() => {
          setScanState("scanning");
          setError("");
        }, 3000);
      }
    }
  };

  const toggleCamera = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Verifying State
  if (scanState === "verifying") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-black mb-2">Verifying QR...</h3>
          <p className="text-gray-600">
            Please approve the transaction in your wallet
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (scanState === "success" && scanResult?.success && scanResult.scan) {
    const { scan, phaseAdvancement, userStats } = scanResult;
    
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center px-8 max-w-md">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-4xl font-bold text-black mb-4">Success!</h2>
          
          {/* QR Code Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{getRarityEmoji(scan.qrCode.rarity)}</span>
              <h3 className="text-xl font-semibold text-black">{scan.qrCode.name}</h3>
            </div>
            {scan.qrCode.description && (
              <p className="text-sm text-gray-600 mb-3">{scan.qrCode.description}</p>
            )}
            <div className="text-3xl font-bold text-green-600 mb-1">
              +{formatTokens(scan.tokensEarned)}
            </div>
            <div className="text-lg text-gray-600">tokens earned!</div>
          </div>

          {/* Phase Advancement */}
          {phaseAdvancement?.advanced && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-bold text-purple-800 mb-1">Level Up!</h4>
              <p className="text-sm text-purple-600">{phaseAdvancement.message}</p>
            </div>
          )}

          {/* Transaction Status */}
          {scan.transactionHash ? (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>Tokens transferred to your wallet!</span>
            </div>
          ) : (
            <div className="text-sm text-yellow-600 mb-4">
              Token transfer in progress...
            </div>
          )}

          {/* Updated Stats */}
          {userStats && (
            <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4" />
                <span>{formatTokens(userStats.totalTokens)} total</span>
              </div>
              <div>
                <span>{userStats.qrCodesScanned} QRs found</span>
              </div>
            </div>
          )}

          <p className="text-gray-500">Returning to dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (scanState === "error") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-black mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Scanning State (Default)
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="bg-white rounded-full p-2 shadow-lg"
        >
          <X className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner overlay with square guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 border-4 border-white rounded-lg relative">
              {/* Corner guides */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white"></div>
            </div>
            <p className="text-white text-center mt-4 text-lg">
              Looking for QR #{expectedQR}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black bg-opacity-75 p-6">
        <div className="text-center mb-4">
          <p className="text-white text-sm mb-2">
            Point your camera at QR code #{expectedQR}
          </p>
        </div>

        {error && (
          <div className="bg-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="text-white text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={captureAndAnalyze}
            disabled={!isScanning}
            className="bg-white text-black px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Scan QR Code
          </button>
          <button
            onClick={toggleCamera}
            className="bg-gray-700 text-white p-3 rounded-lg"
          >
            {isScanning ? (
              <CameraOff className="w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
        </div>

        <p className="text-gray-400 text-xs text-center mt-4">
          Demo: Manual input will appear for testing
        </p>
      </div>
    </div>
  );
}
