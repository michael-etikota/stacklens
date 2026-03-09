import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  connectWallet,
  disconnectWallet,
  checkIsConnected,
  type ConnectResult,
} from "@/lib/stacks";
import { useNetwork } from "@/contexts/NetworkContext";

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
  const { network } = useNetwork();
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    walletType: null,
    isConnecting: false,
  });

  // Check if already connected on mount
  useEffect(() => {
    if (checkIsConnected()) {
      // Already connected from previous session – reconnect silently
      connectWallet(network)
        .then((result: ConnectResult) => {
          setState({
            isConnected: true,
            address: result.stxAddress,
            walletType: null,
            isConnecting: false,
          });
        })
        .catch(() => { /* silent fail on auto-reconnect */ });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async (walletType: WalletType) => {
    setState((s) => ({ ...s, isConnecting: true }));
    try {
      const result = await connectWallet(network);
      setState({
        isConnected: true,
        address: result.stxAddress,
        walletType,
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
