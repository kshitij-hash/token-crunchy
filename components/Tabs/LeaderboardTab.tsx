"use client";

import { useState, useEffect } from "react";
import { Loader } from "../retroui/Loader";
import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";

interface LeaderboardEntry {
  id: string;
  address: string;
  crunchies: number;
  qrsScanned: number;
  rank: number;
}

interface LeaderboardTabProps {
  currentUserAddress?: string;
}

const leaderboardData: LeaderboardEntry[] = [
  {
    id: "1",
    address: "0x1234...5678",
    crunchies: 1250,
    qrsScanned: 20,
    rank: 1,
  },
  {
    id: "2",
    address: "0x9876...4321",
    crunchies: 1100,
    qrsScanned: 18,
    rank: 2,
  },
  {
    id: "3",
    address: "0xabcd...efgh",
    crunchies: 950,
    qrsScanned: 15,
    rank: 3,
  },
  {
    id: "4",
    address: "0x5555...6666",
    crunchies: 800,
    qrsScanned: 12,
    rank: 4,
  },
  {
    id: "5",
    address: "0x7777...8888",
    crunchies: 650,
    qrsScanned: 10,
    rank: 5,
  },
  { id: "6", address: "0x1111...2222", crunchies: 500, qrsScanned: 8, rank: 6 },
  { id: "7", address: "0x3333...4444", crunchies: 400, qrsScanned: 6, rank: 7 },
];

export function LeaderboardTab({ currentUserAddress }: LeaderboardTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  // Simulate loading data from backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData(leaderboardData);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-xl">🥇</span>;
      case 2:
        return <span className="text-xl">🥈</span>;
      case 3:
        return <span className="text-xl">🥉</span>;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
            #{rank}
          </span>
        );
    }
  };

  const isCurrentUser = (address: string) => {
    return (
      currentUserAddress &&
      address.toLowerCase() === currentUserAddress.toLowerCase()
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader size="lg" count={3} />
        <Text className="text-gray-600">Loading leaderboard...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <Card
          key={entry.id}
          className={`bg-white w-full ${
            isCurrentUser(entry.address) ? "bg-gray-50" : ""
          }`}
        >
          <Card.Content className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {getRankIcon(entry.rank)}
              <div>
                <Text className="font-semibold text-black">
                  {entry.address}
                  {isCurrentUser(entry.address) && (
                    <span className="ml-2 text-xs bg-black text-white px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </Text>
                <Text className="text-sm text-gray-600">
                  {entry.qrsScanned}/20 QR codes found
                </Text>
              </div>
            </div>

            <div className="text-right">
              <Text className="text-lg font-bold text-black">
                {entry.crunchies}
              </Text>
              <Text className="text-sm text-gray-600">$crunchies</Text>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
