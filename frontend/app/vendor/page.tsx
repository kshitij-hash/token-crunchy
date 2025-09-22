"use client";

import { useState } from "react";
import { VendorLogin } from "@/components/vendor/VendorLogin";
import { VendorPOS } from "@/components/vendor/VendorPOS";

export default function VendorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <VendorLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return <VendorPOS />;
}
