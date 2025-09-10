"use client";

import { CheckCircle, Circle, Lock } from "lucide-react";
import { Text } from "../retroui/Text";

interface ScannedQR {
  id: number;
  timestamp: Date;
  location?: string;
}

interface ProgressTrackerProps {
  scannedQRs: ScannedQR[];
}

export function ProgressTracker({ scannedQRs }: ProgressTrackerProps) {
  const totalQRs = 15;
  const scannedIds = new Set(scannedQRs.map((qr) => qr.id));
  const nextQR = scannedQRs.length + 1;

  const getQRStatus = (qrId: number) => {
    if (scannedIds.has(qrId)) return "completed";
    if (qrId === nextQR) return "current";
    if (qrId < nextQR) return "missed";
    return "locked";
  };

  const getStatusIcon = (qrId: number) => {
    const status = getQRStatus(qrId);
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "current":
        return <Circle className="w-5 h-5 text-blue-600" />;
      case "locked":
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (qrId: number) => {
    const status = getQRStatus(qrId);
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 text-green-700";
      case "current":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "locked":
        return "bg-gray-50 border-gray-200 text-gray-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-400";
    }
  };

  const progressPercentage = (scannedQRs.length / totalQRs) * 100;

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="text-center mb-6">
        <Text as="h2" className="text-xl font-bold text-gray-900 mb-2">
          Progress Tracker
        </Text>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Text className="text-gray-600">
            {scannedQRs.length} / {totalQRs} QR Codes Found
          </Text>
          <Text className="text-gray-700 font-bold">
            {Math.round(progressPercentage)}%
          </Text>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {nextQR <= totalQRs && (
          <Text className="text-blue-600 font-medium">
            Next: QR Code #{nextQR}
          </Text>
        )}
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
        {Array.from({ length: totalQRs }, (_, i) => {
          const qrId = i + 1;

          return (
            <div
              key={qrId}
              className={`
                flex flex-col items-center justify-center p-2 rounded border-2 transition-all
                ${getStatusColor(qrId)}
              `}
            >
              {getStatusIcon(qrId)}
              <Text className="text-xs font-medium mt-1">{qrId}</Text>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <Text className="text-gray-600">Completed</Text>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-4 h-4 text-blue-600" />
          <Text className="text-gray-600">Current</Text>
        </div>
        <div className="flex items-center gap-1">
          <Lock className="w-4 h-4 text-gray-400" />
          <Text className="text-gray-600">Locked</Text>
        </div>
      </div>

      {/* Recent Scans */}
      {scannedQRs.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <Text as="h3" className="text-sm font-semibold text-gray-900 mb-2">
            Recent Scans
          </Text>
          <div className="space-y-1">
            {scannedQRs
              .slice(-3)
              .reverse()
              .map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-1"
                >
                  <Text className="text-green-600 font-medium text-sm">
                    QR #{qr.id}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(qr.timestamp).toLocaleTimeString()}
                  </Text>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
