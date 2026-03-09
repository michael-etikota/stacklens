import { useQuery } from "@tanstack/react-query";
import { useNetwork } from "@/contexts/NetworkContext";
import {
  simulateRewards,
  simulatePoolRewards,
  fetchProjections,
  type SimulationResult,
  type PoolSimulationResult,
} from "@/lib/api";
import { STACKING } from "@/lib/constants";
import { calculateRewards } from "@/data/mock-data";

// Shape the UI expects
export interface SimulatorResult {
  apy: number;
  btcPerCycle: number;
  totalBtc: number;
  totalUsd: number;
  projections: Array<{ cycle: number; cumulativeBtc: number; cumulativeUsd: number }>;
}

const BTC_USD = 62_350; // Could be fetched from price API

function soloApiToResult(
  sim: SimulationResult,
  lockCycles: number,
): SimulatorResult {
  const apy = sim.annualizedYieldBps / 100;
  const totalBtc = sim.estimatedBtc;
  const btcPerCycle = totalBtc / Math.max(lockCycles, 1);
  const totalUsd = totalBtc * BTC_USD;
  const projections = Array.from({ length: lockCycles }, (_, i) => ({
    cycle: i + 1,
    cumulativeBtc: btcPerCycle * (i + 1),
    cumulativeUsd: btcPerCycle * (i + 1) * BTC_USD,
  }));
  return { apy, btcPerCycle, totalBtc, totalUsd, projections };
}

function poolApiToResult(
  pool: PoolSimulationResult,
  lockCycles: number,
): SimulatorResult {
  const totalBtc = pool.netBtc;
  const btcPerCycle = totalBtc / Math.max(lockCycles, 1);
  const totalUsd = totalBtc * BTC_USD;
  // Pool fee already deducted; derive effective APY
  const apy = pool.poolFeeBps > 0
    ? (pool.netBtc / (pool.netBtc + Number(pool.poolFeeSats) / STACKING.SATS_PER_BTC)) * 100
    : 0;
  const projections = Array.from({ length: lockCycles }, (_, i) => ({
    cycle: i + 1,
    cumulativeBtc: btcPerCycle * (i + 1),
    cumulativeUsd: btcPerCycle * (i + 1) * BTC_USD,
  }));
  return { apy, btcPerCycle, totalBtc, totalUsd, projections };
}

/**
 * Hook that fetches simulation results from the backend API.
 * Falls back to local `calculateRewards` while loading or on error.
 */
export function useSimulation(
  stxAmount: number,
  lockCycles: number,
  mode: "solo" | "pool",
  poolFeeBps = 500,
) {
  const { network } = useNetwork();
  const fallback = calculateRewards(stxAmount, lockCycles, mode, poolFeeBps / 100);

  const query = useQuery({
    queryKey: ["simulation", network, stxAmount, lockCycles, mode, poolFeeBps],
    queryFn: async (): Promise<SimulatorResult> => {
      if (mode === "solo") {
        const sim = await simulateRewards(network, stxAmount, lockCycles);
        return soloApiToResult(sim, lockCycles);
      }
      const pool = await simulatePoolRewards(network, stxAmount, lockCycles, poolFeeBps);
      return poolApiToResult(pool, lockCycles);
    },
    enabled: stxAmount > 0 && lockCycles > 0,
    staleTime: 30_000,
    retry: 1,
  });

  // Return API result when available, otherwise local calculation
  return {
    data: query.data ?? fallback,
    isLoading: query.isLoading,
    isLive: !!query.data && !query.isError,
  };
}
