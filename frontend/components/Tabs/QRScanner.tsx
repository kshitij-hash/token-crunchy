"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, X, CheckCircle, Coins } from "lucide-react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { formatTokens, getRarityEmoji } from "@/lib/api-client";
import { extractQRMetadata, validateQRMetadata, QRMetadata } from "@/lib/qr-generator";
import QrScanner from "qr-scanner";

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
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [hasCamera, setHasCamera] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<QRMetadata | null>(null);
  
  const {
    isProcessing,
    result: scanResult,
    error: scanError,
    processQRCode,
    clearResult
  } = useQRScanner();

  const handleQRResult = async (result: QrScanner.ScanResult) => {
    const qrCode = result.data;
    
    if (!qrCode || isProcessing) return;

    // Stop scanning temporarily while processing
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }

    // Step 1: Extract and validate QR metadata locally first
    console.log('🔍 Scanned QR Code:', qrCode);
    
    const metadata = extractQRMetadata(qrCode.trim());
    if (!metadata) {
      setScanState("error");
      setError("Invalid QR code format. Please scan a Token Crunchies QR code.");
      
      setTimeout(() => {
        setScanState("scanning");
        setError("");
        // Resume scanning
        if (qrScannerRef.current && hasCamera) {
          qrScannerRef.current.start();
        }
      }, 3000);
      return;
    }

    console.log('✅ Extracted metadata:', metadata);
    setExtractedMetadata(metadata);

    // Step 2: Show verifying state
    setScanState("verifying");
    setError("");

    try {
      // Process QR code with backend (send the original QR string)
      const processResult = await processQRCode(qrCode.trim());

      if (processResult.success && processResult.result) {
        // Step 3: Show success state
        setScanState("success");

        // Step 4: Auto-navigate back after showing success
        setTimeout(() => {
          onQRScanned(qrCode.trim());
          onClose();
          clearResult();
        }, 4000);
      } else {
        // Show error state
        setScanState("error");
        setError(processResult.error || scanError || "QR scan failed");
        
        setTimeout(() => {
          setScanState("scanning");
          setError("");
          setExtractedMetadata(null);
          // Resume scanning
          if (qrScannerRef.current && hasCamera) {
            qrScannerRef.current.start();
          }
        }, 3000);
      }
    } catch (error) {
      setScanState("error");
      setError(error instanceof Error ? error.message : "QR scan failed");
      
      setTimeout(() => {
        setScanState("scanning");
        setError("");
        setExtractedMetadata(null);
        // Resume scanning
        if (qrScannerRef.current && hasCamera) {
          qrScannerRef.current.start();
        }
      }, 3000);
    }
  };

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      setError("");
      
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError("No camera found on this device");
        return;
      }

      setHasCamera(true);

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        handleQRResult,
        {
          onDecodeError: (err) => {
            // Ignore decode errors - they're normal when no QR code is visible
            console.debug("QR decode error:", err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera permissions and try again.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (err.name === 'NotSupportedError') {
          setError("Camera not supported on this device.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera. Please check permissions.");
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setHasCamera(false);
  }, []);

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
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-black mb-2">Verifying QR...</h3>
          
          {extractedMetadata && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Found:</strong> {extractedMetadata.name || extractedMetadata.code}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Phase:</strong> {extractedMetadata.phase.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Reward:</strong> {extractedMetadata.tokenReward} tokens
              </div>
              <div className="text-sm text-gray-600">
                <strong>Rarity:</strong> {extractedMetadata.rarity}
              </div>
            </div>
          )}
          
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
          <p className="text-gray-400 text-xs">
            Looking for TOKEN_CRUNCHIES:// format
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
          {isScanning ? "Camera is active - point at QR code to scan" : "Camera is off"}
        </p>
      </div>
    </div>
  );
}
