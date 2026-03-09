import { useQuery } from "@tanstack/react-query";
import {
  mockStackingStats,
  mockNetworkStats,
  mockYieldHistory,
  mockStackingPosition,
  mockCycleProgress,
  mockRecentActivity,
  mockPools,
  mockTransactionHistory,
} from "@/data/mock-data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useStackingStats(enabled = true) {
  return useQuery({
    queryKey: ["stacking-stats"],
    queryFn: async () => { await delay(600); return mockStackingStats; },
    enabled,
  });
}

export function useNetworkStats() {
  return useQuery({
    queryKey: ["network-stats"],
    queryFn: async () => { await delay(400); return mockNetworkStats; },
  });
}

export function useYieldHistory(enabled = true) {
  return useQuery({
    queryKey: ["yield-history"],
    queryFn: async () => { await delay(800); return mockYieldHistory; },
    enabled,
  });
}

export function useStackingPosition(enabled = true) {
  return useQuery({
    queryKey: ["stacking-position"],
    queryFn: async () => { await delay(500); return mockStackingPosition; },
    enabled,
  });
}

export function useCycleProgress(enabled = true) {
  return useQuery({
    queryKey: ["cycle-progress"],
    queryFn: async () => { await delay(300); return mockCycleProgress; },
    enabled,
  });
}

export function useRecentActivity(enabled = true) {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => { await delay(500); return mockRecentActivity; },
    enabled,
  });
}

export function usePools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => { await delay(400); return mockPools; },
  });
}

export function useTransactionHistory(enabled = true) {
  return useQuery({
    queryKey: ["transaction-history"],
    queryFn: async () => { await delay(600); return mockTransactionHistory; },
    enabled,
  });
}
