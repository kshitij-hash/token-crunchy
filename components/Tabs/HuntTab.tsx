"use client";

import { useState, useEffect } from "react";
import { Loader } from "../retroui/Loader";
import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";
import { ProgressTracker } from "./ProgressTracker";
import { Button } from "../retroui/Button";

interface ScannedQR {
  id: number;
  timestamp: Date;
  location?: string;
}

interface HuntTabProps {
  scannedQRs: ScannedQR[];
  onScanQR: () => void;
}

export function HuntTab({ scannedQRs, onScanQR }: HuntTabProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading hunt data from backend
  useEffect(() => {
    const loadHuntData = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsLoading(false);
    };

    loadHuntData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader size="lg" count={3} />
        <Text className="text-gray-600">Loading your hunt progress...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-black rounded-lg w-full">
        <Card.Header>
          <Card.Title>Your Hunt</Card.Title>
        </Card.Header>
        <Card.Content>
          <ProgressTracker scannedQRs={scannedQRs} />
          <div className="mt-4">
            <Button
              variant="default"
              onClick={onScanQR}
              className="w-full py-4 px-6 rounded-lg"
            >
              Scan Next QR Code
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
