"use client";

import { useState } from "react";

interface VendorLoginProps {
  onLogin: () => void;
}

export function VendorLogin({ onLogin }: VendorLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple password check (in production, this would be more secure)
    if (password === "vendor123") {
      onLogin();
    } else {
      setError("Invalid password");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Vendor POS</h1>
          <p className="text-gray-600">Athena Hackerhouse</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-black mb-3">
              Enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 text-xl border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Password"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 text-center">
              <span className="text-red-700 font-semibold">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-4 px-6 rounded-lg text-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Demo password: vendor123</p>
        </div>
      </div>
    </div>
  );
}
