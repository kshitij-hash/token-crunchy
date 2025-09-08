"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/retroui/Button";

interface QRScannerProps {
  onQRScanned: (qrId: number) => void;
  expectedQR: number;
}

export function QRScanner({ onQRScanned, expectedQR }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions and try again.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simulate QR code detection (in a real app, you'd use a QR code library)
    // For demo purposes, we'll create a manual input
    const qrCode = prompt(`Scan QR #${expectedQR}\n\nFor demo: Enter the QR code number (1-20):`);
    
    if (qrCode) {
      const qrId = parseInt(qrCode);
      if (!isNaN(qrId) && qrId >= 1 && qrId <= 20) {
        onQRScanned(qrId);
      } else {
        alert("Invalid QR code! Please enter a number between 1-20.");
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

  return (
    <div className="bg-white border rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          QR Scanner - Looking for #{expectedQR}
        </h3>
        <p className="text-gray-600 text-sm">
          Point your camera at QR code #{expectedQR}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 bg-gray-100 rounded border object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanner overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-2 border-blue-600 rounded">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-600"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-600"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-600"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-600"></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={captureAndAnalyze}
          disabled={!isScanning}
          className="flex-1"
        >
          Scan QR Code
        </Button>
        <Button
          variant="outline"
          onClick={toggleCamera}
          className="px-3"
        >
          {isScanning ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">
        Note: This is a demo version. In production, automatic QR detection would be implemented.
      </p>
    </div>
  );
}
