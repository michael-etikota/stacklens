import React, { createContext, useContext, useState } from "react";
import type { NetworkId } from "@/lib/constants";

interface NetworkContextType {
  network: NetworkId;
  setNetwork: (n: NetworkId) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<NetworkId>("testnet");

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
