import React, { createContext, useContext, useState, useCallback } from "react";
import { MOCK_WALLET_ADDRESS } from "@/data/mock-data";

type WalletType = "hiro" | "xverse" | "leather";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType | null;
  isConnecting: boolean;
}

interface WalletContextType extends WalletState {
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  truncatedAddress: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    walletType: null,
    isConnecting: false,
  });

  const connect = useCallback(async (walletType: WalletType) => {
    setState((s) => ({ ...s, isConnecting: true }));
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1200));
    setState({
      isConnected: true,
      address: MOCK_WALLET_ADDRESS,
      walletType,
      isConnecting: false,
    });
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      walletType: null,
      isConnecting: false,
    });
  }, []);

  const truncatedAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, truncatedAddress }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
