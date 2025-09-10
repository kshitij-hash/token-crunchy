"use client";

import { useState, useEffect } from "react";
import { Loader } from "../retroui/Loader";
import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: "snack" | "drink";
  emoji: string;
  description: string;
  inStock: boolean;
}

interface ShopTabProps {
  totalCrunchies: number;
  onPurchase: (item: ShopItem) => void;
}

const shopItems: ShopItem[] = [
  {
    id: "redbull",
    name: "Red Bull",
    price: 25,
    category: "drink",
    emoji: "🥤",
    description: "Energy drink",
    inStock: true,
  },
  {
    id: "chips",
    name: "Chips",
    price: 15,
    category: "snack",
    emoji: "🍟",
    description: "Crispy snack",
    inStock: true,
  },
  {
    id: "coffee",
    name: "Coffee",
    price: 20,
    category: "drink",
    emoji: "☕",
    description: "Hot coffee",
    inStock: true,
  },
  {
    id: "chocolate",
    name: "Chocolate",
    price: 30,
    category: "snack",
    emoji: "🍫",
    description: "Sweet treat",
    inStock: false,
  },
];

export function ShopTab({ totalCrunchies, onPurchase }: ShopTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ShopItem[]>([]);

  // Simulate loading shop items from backend
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      setItems(shopItems);
      setIsLoading(false);
    };
    
    loadItems();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader size="lg" count={4} />
        <Text className="text-gray-600">Loading shop items...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {items.map((item: ShopItem) => {
          const canAfford = totalCrunchies >= item.price && item.inStock;

          return (
            <Card key={item.id} className="bg-white">
              <Card.Content className="text-center space-y-3 p-4">
                <div className="text-3xl">{item.emoji}</div>
                <div>
                  <Text as="h4" className="font-semibold text-black">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {item.description}
                  </Text>
                </div>
                <Text className="text-lg font-bold text-black">
                  {item.price} $crunchies
                </Text>
                <button
                  onClick={() => canAfford && onPurchase(item)}
                  disabled={!canAfford}
                  // variant={canAfford ? "default" : "outline"}
                  className={`w-full py-2 ${
                    !canAfford
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300 hover:bg-gray-200 hover:translate-y-0 shadow-none"
                      : "bg-black text-white border-black hover:bg-gray-800"
                  }`}
                >
                  {!item.inStock
                    ? "Out of Stock"
                    : canAfford
                    ? "Redeem"
                    : "Insufficient Funds"}
                </button>
              </Card.Content>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
