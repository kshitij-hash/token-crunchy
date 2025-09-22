"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: "snack" | "drink";
  emoji: string;
  description: string;
  inStock: boolean;
}

const vendorItems: ShopItem[] = [
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
    inStock: true,
  },
  {
    id: "water",
    name: "Water",
    price: 10,
    category: "drink",
    emoji: "💧",
    description: "Bottled water",
    inStock: true,
  },
  {
    id: "sandwich",
    name: "Sandwich",
    price: 35,
    category: "snack",
    emoji: "🥪",
    description: "Fresh sandwich",
    inStock: true,
  },
];

type POSState = 'menu' | 'payment' | 'success';

export function VendorPOS() {
  const [posState, setPosState] = useState<POSState>('menu');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [paymentQR, setPaymentQR] = useState<string>("");

  const handleItemSelect = (item: ShopItem) => {
    setSelectedItem(item);
    
    // Generate payment QR code (in production, this would be a real payment link)
    const paymentLink = `https://metamask.app.link/send/0xVENDOR123?value=${item.price}&token=EVT&item=${item.name}&timestamp=${Date.now()}`;
    setPaymentQR(paymentLink);
    setPosState('payment');

    // Simulate payment listening (in production, this would listen for actual blockchain transactions)
    setTimeout(() => {
      setPosState('success');
      
      // Auto-return to menu after success
      setTimeout(() => {
        setPosState('menu');
        setSelectedItem(null);
        setPaymentQR("");
      }, 4000);
    }, 8000); // 8 seconds to simulate payment time
  };

  const handleCancel = () => {
    setPosState('menu');
    setSelectedItem(null);
    setPaymentQR("");
  };

  // Menu State
  if (posState === 'menu') {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">Point of Sale</h1>
          <p className="text-xl text-gray-600">Select an item to generate payment QR</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {vendorItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemSelect(item)}
              disabled={!item.inStock}
              className={`p-8 rounded-2xl border-4 border-black text-center transition-all hover:scale-105 ${
                item.inStock 
                  ? 'bg-white hover:bg-gray-50 active:bg-gray-100' 
                  : 'bg-gray-200 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-6xl mb-4">{item.emoji}</div>
              <h3 className="text-2xl font-bold text-black mb-2">{item.name}</h3>
              <div className="text-3xl font-bold text-black mb-2">{item.price} $crunchies</div>
              <p className="text-gray-600">{item.description}</p>
              {!item.inStock && (
                <div className="mt-2 text-red-600 font-semibold">Out of Stock</div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Payment State - Show QR Code
  if (posState === 'payment') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h2 className="text-4xl font-bold text-black mb-4">
            {selectedItem?.name} - {selectedItem?.price} $crunchies
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Customer: Scan this QR code with your phone camera
          </p>

          <div className="bg-white border-4 border-black rounded-2xl p-8 mb-8 inline-block">
            <QRCodeSVG 
              value={paymentQR}
              size={300}
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="space-y-4">
            <p className="text-lg text-gray-600">
              Waiting for payment confirmation...
            </p>
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
          </div>

          <button
            onClick={handleCancel}
            className="mt-8 bg-gray-200 text-black px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    );
  }

  // Success State
  if (posState === 'success') {
    return (
      <div className="min-h-screen bg-green-500 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-9xl mb-8">✅</div>
          <h2 className="text-6xl font-bold text-white mb-4">
            Payment Successful!
          </h2>
          <p className="text-2xl text-white mb-8">
            {selectedItem?.name} - {selectedItem?.price} $crunchies
          </p>
          <p className="text-xl text-green-100">
            Hand over the item to customer
          </p>
        </div>
      </div>
    );
  }

  return null;
}
