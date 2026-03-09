import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/contexts/NetworkContext";
import { useWallet } from "@/contexts/WalletContext";
import {
  fetchStats,
  fetchCycle,
  fetchAccount,
  fetchRewards,
  fetchBalances,
  fetchPoxInfo,
  type StatsData,
  type CycleData,
  type AccountData,
  type RewardData,
} from "@/lib/api";
import { STACKING } from "@/lib/constants";
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

// ---------------------------------------------------------------------------
// Live data hooks (hit real backend / Hiro API; fall back to mock)
// ---------------------------------------------------------------------------

export function useStackingStats(enabled = true) {
  const { network } = useNetwork();
  const { address, isConnected } = useWallet();

  return useQuery({
    queryKey: ["stacking-stats", network, address],
    queryFn: async () => {
      try {
        const [stats, pox] = await Promise.all([
          fetchStats(network),
          fetchPoxInfo(network),
        ]);

        let stxBalance = 0;
        let currentlyStacked = 0;

        if (address) {
          const balances = await fetchBalances(network, address);
          stxBalance = Number(BigInt(balances.stx.balance)) / STACKING.MICRO_STX_PER_STX;
          currentlyStacked = Number(BigInt(balances.stx.locked)) / STACKING.MICRO_STX_PER_STX;
        }

        let cumulativeBtcRewards = 0;
        if (address) {
          try {
            const rewards = await fetchRewards(network, address);
            cumulativeBtcRewards = rewards.totalRewardsBtc;
          } catch { /* no rewards yet */ }
        }

        return {
          stxBalance,
          currentlyStacked,
          currentAPY: stats.estimatedApy,
          apyChange: 0,
          cumulativeBtcRewards,
          btcUsdPrice: 62_350, // Could be fetched from a price API
          stxUsdPrice: 1.82,
        };
      } catch {
        // Fallback to mock when backend is unavailable
        return mockStackingStats;
      }
    },
    enabled: enabled && isConnected,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useNetworkStats() {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["network-stats", network],
    queryFn: async () => {
      try {
        const [stats, cycle] = await Promise.all([
          fetchStats(network),
          fetchCycle(network),
        ]);

        return {
          totalStacked: Number(BigInt(stats.totalStacked)) / STACKING.MICRO_STX_PER_STX,
          averageAPY: stats.estimatedApy,
          btcDistributed: 0, // Aggregated from on-chain data
          activeStackers: 0,
          currentCycle: stats.currentCycle,
          nextCycleBlocks: cycle.blocksRemaining,
        };
      } catch {
        return mockNetworkStats;
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useYieldHistory(enabled = true) {
  return useQuery({
    queryKey: ["yield-history"],
    queryFn: async () => {
      // Yield history requires historical indexing; use mock for now.
      // In production, this would query a time-series backend endpoint.
      return mockYieldHistory;
    },
    enabled,
  });
}

export function useStackingPosition(enabled = true) {
  const { network } = useNetwork();
  const { address, isConnected } = useWallet();

  return useQuery({
    queryKey: ["stacking-position", network, address],
    queryFn: async () => {
      if (!address) return mockStackingPosition;
      try {
        const account = await fetchAccount(network, address);

        if (!account.isStacking) {
          return {
            status: "inactive" as const,
            amountStacked: 0,
            lockPeriod: 0,
            cyclesCompleted: 0,
            cyclesRemaining: 0,
            startCycle: 0,
            endCycle: 0,
            unlockBurnHeight: 0,
            currentBurnHeight: 0,
            poolName: null as string | null,
          };
        }

        const locked = Number(BigInt(account.locked)) / STACKING.MICRO_STX_PER_STX;
        const cycle = await fetchCycle(network);

        return {
          status: "active" as const,
          amountStacked: locked,
          lockPeriod: account.unlock?.lockPeriod ?? 0,
          cyclesCompleted: account.unlock
            ? cycle.id - account.unlock.startCycle
            : 0,
          cyclesRemaining: account.unlock
            ? account.unlock.lockPeriod - (cycle.id - account.unlock.startCycle)
            : 0,
          startCycle: account.unlock?.startCycle ?? 0,
          endCycle: account.unlock
            ? account.unlock.startCycle + account.unlock.lockPeriod
            : 0,
          unlockBurnHeight: account.unlock?.unlockHeight ?? 0,
          currentBurnHeight: cycle.currentBlockHeight,
          poolName: null as string | null,
        };
      } catch {
        return mockStackingPosition;
      }
    },
    enabled: enabled && isConnected,
    refetchInterval: 60_000,
  });
}

export function useCycleProgress(enabled = true) {
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["cycle-progress", network],
    queryFn: async () => {
      try {
        const cycle = await fetchCycle(network);
        return {
          currentCycle: cycle.id,
          phase: cycle.phase,
          blocksElapsed: cycle.progress * (cycle.blocksRemaining / (100 - cycle.progress) || 0),
          totalBlocks: cycle.endBlockHeight - cycle.startBlockHeight,
          eta: cycle.estimatedTimeRemaining,
        };
      } catch {
        return mockCycleProgress;
      }
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useRecentActivity(enabled = true) {
  const { address, isConnected } = useWallet();
  const { network } = useNetwork();

  return useQuery({
    queryKey: ["recent-activity", network, address],
    queryFn: async () => {
      if (!address) return mockRecentActivity;
      try {
        const rewards = await fetchRewards(network, address);
        return rewards.rewards.slice(0, 5).map((r, i) => ({
          id: String(i),
          type: "reward" as const,
          amount: `${(Number(r.reward_amount) / STACKING.SATS_PER_BTC).toFixed(4)} BTC`,
          date: new Date(r.burn_block_height * 600_000).toISOString().slice(0, 10), // approximate
          cycle: 0,
        }));
      } catch {
        return mockRecentActivity;
      }
    },
    enabled: enabled && isConnected,
  });
}

export function usePools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      // Pool registry is on-chain in stacking-analytics contract.
      // For now return curated list; integrate contract reads in v2.
      return mockPools;
    },
  });
}

export function useTransactionHistory(enabled = true) {
  return useQuery({
    queryKey: ["transaction-history"],
    queryFn: async () => {
      // Full tx history requires extended indexer.
      // Mock for now; will integrate Hiro extended API.
      return mockTransactionHistory;
    },
    enabled,
  });
}
