"use client";

import { Home, ShoppingCart, Trophy } from "lucide-react";
import { Tabs, TabsTriggerList, TabsTrigger } from "@/components/retroui/Tab";

interface TabNavigationProps {
  activeTab: "home" | "shop" | "leaderboard";
  onTabChange: (tab: "home" | "shop" | "leaderboard") => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: Home,
      description: "Your dashboard"
    },
    {
      id: "shop" as const,
      label: "Shop",
      icon: ShoppingCart,
      description: "Redeem items"
    },
    {
      id: "leaderboard" as const,
      label: "Leaderboard",
      icon: Trophy,
      description: "View rankings"
    }
  ];

  const selectedIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="bg-white border-t-2 border-black px-4 py-2">
      <Tabs 
        selectedIndex={selectedIndex} 
        onChange={(index) => onTabChange(tabs[index].id)}
      >
        <TabsTriggerList className="flex w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            
            return (
              <TabsTrigger
                key={tab.id}
                className="flex-1 flex flex-col items-center py-3 px-2 border-0 data-selected:bg-[#ffdb33] data-selected:text-black text-gray-500 hover:text-black hover:bg-gray-100 transition-colors duration-200"
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsTriggerList>
      </Tabs>
    </div>
  );
}
