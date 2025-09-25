"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle, X, CheckCircle, Coins } from "lucide-react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { formatTokens, getRarityEmoji } from "@/lib/api-client";
import { extractQRMetadata } from "@/lib/qr-generator";
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
  const lastScannedCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [hasCamera, setHasCamera] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<{ code: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const {
    isProcessing,
    result: scanResult,
    error: scanError,
    processQRCode,
    clearResult
  } = useQRScanner();

  const handleQRResult = useCallback(async (result: QrScanner.ScanResult) => {
    const qrCode = result.data;
    const now = Date.now();
    
    // Prevent duplicate scans: same QR code within 2 seconds
    if (!qrCode || isProcessing || 
        (lastScannedCodeRef.current === qrCode && now - lastScanTimeRef.current < 2000)) {
      console.log('🚫 Ignoring duplicate or invalid scan:', { 
        qrCode, 
        isProcessing, 
        isDuplicate: lastScannedCodeRef.current === qrCode,
        timeSinceLastScan: now - lastScanTimeRef.current 
      });
      return;
    }

    // Update scan tracking
    lastScannedCodeRef.current = qrCode;
    lastScanTimeRef.current = now;

    // Stop scanning temporarily while processing - but don't destroy
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
      } catch (error) {
        console.warn('Error stopping scanner:', error);
      }
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
        // Resume scanning safely
        if (qrScannerRef.current && hasCamera) {
          try {
            qrScannerRef.current.start();
          } catch (error) {
            console.warn('Error resuming scanner:', error);
            // If resume fails, restart camera
            startCamera();
          }
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
          // Resume scanning safely
          if (qrScannerRef.current && hasCamera) {
            try {
              qrScannerRef.current.start();
            } catch (error) {
              console.warn('Error resuming scanner:', error);
              // If resume fails, restart camera
              startCamera();
            }
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
        // Resume scanning safely
        if (qrScannerRef.current && hasCamera) {
          try {
            qrScannerRef.current.start();
          } catch (error) {
            console.warn('Error resuming scanner:', error);
            // If resume fails, restart camera
            startCamera();
          }
        }
      }, 3000);
    }
  }, [isProcessing, processQRCode, clearResult, hasCamera, onClose, onQRScanned, scanError]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || isInitializing) return;

    try {
      setIsInitializing(true);
      setError("");
      
      // Stop any existing scanner first to prevent conflicts
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
          qrScannerRef.current.destroy();
        } catch (error) {
          console.warn('Error cleaning up existing scanner:', error);
        }
        qrScannerRef.current = null;
      }

      // Add a small delay to ensure cleanup is complete (important for mobile)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setError("No camera found on this device");
        return;
      }

      setHasCamera(true);

      // Create QR scanner instance with mobile-optimized settings
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
          maxScansPerSecond: 5, // Reduce scan frequency for mobile performance
        }
      );

      try {
        // Add retry logic for mobile video loading issues
        let retries = 3;
        while (retries > 0) {
          try {
            await qrScannerRef.current.start();
            setIsScanning(true);
            break;
          } catch (startError: any) {
            retries--;
            console.warn(`Scanner start attempt failed (${3 - retries}/3):`, startError);
            
            if (retries === 0) {
              throw startError;
            }
            
            // Wait before retry, especially important for mobile
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (startError) {
        console.error('Error starting scanner after retries:', startError);
        throw startError;
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera permissions and try again.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found on this device.");
        } else if (err.name === 'NotSupportedError') {
          setError("Camera not supported on this device.");
        } else if (err.message?.includes('play() request was interrupted')) {
          setError("Camera loading interrupted. Please try again.");
        } else if (err.message?.includes('load request')) {
          setError("Camera is busy. Please close other camera apps and try again.");
        } else if (err.message?.includes('only accessible if the page is transferred via https')) {
          setError("Camera requires HTTPS. Please use https://localhost:3000 or deploy to a secure server.");
        } else if (err.name === 'AbortError') {
          setError("Camera operation was cancelled. Please try again.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera. Please check permissions.");
      }
    } finally {
      setIsInitializing(false);
    }
  }, [handleQRResult]);

  const stopCamera = useCallback(() => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (error) {
        console.warn('Error stopping/destroying scanner:', error);
      } finally {
        qrScannerRef.current = null;
      }
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
  }, [startCamera, stopCamera]);

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
                <strong>QR Code:</strong> {extractedMetadata.code}
              </div>
              <div className="text-sm text-gray-500">
                Validating with server...
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
            Looking for random QR codes
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
