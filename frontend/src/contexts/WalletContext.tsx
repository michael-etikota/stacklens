import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  connectWallet,
  disconnectWallet,
  checkIsConnected,
  type ConnectResult,
} from "@/lib/stacks";
import { getLocalStorage } from "@stacks/connect";
import { useNetwork } from "@/contexts/NetworkContext";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  truncatedAddress: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { network } = useNetwork();
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
  });

  // Restore session silently from local storage (no popup)
  useEffect(() => {
    if (checkIsConnected()) {
      const stored = getLocalStorage();
      if (stored) {
        const stxEntry = stored.addresses.stx?.[0];
        if (stxEntry?.address) {
          setState({
            isConnected: true,
            address: stxEntry.address,
            isConnecting: false,
          });
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true }));
    try {
      const result = await connectWallet(network);
      setState({
        isConnected: true,
        address: result.stxAddress,
        isConnecting: false,
      });
    } catch {
      setState((s) => ({ ...s, isConnecting: false }));
      throw new Error("Wallet connection failed or was cancelled");
    }
  }, [network]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setState({
      isConnected: false,
      address: null,
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
