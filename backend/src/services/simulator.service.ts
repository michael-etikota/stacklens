// StackLens - Reward Simulator Service
// Calculates estimated BTC rewards for stacking

import { config } from '../config/index.js';
import { getStackingStats } from './stacking.service.js';
import type { RewardSimulation, DelegationComparison, PoolInfo } from '../types/index.js';

// Constants
const SATS_PER_BTC = 100_000_000n;
const USTX_PER_STX = 1_000_000n;
const BPS_DENOMINATOR = 10_000n;

// Historical average BTC rewards per cycle (in sats) - placeholder
// In production, this would be fetched from the stacking-analytics contract
let avgBtcPerCycleSats = 500_000_000n; // 5 BTC per cycle placeholder
let historicalYieldBps = 50n; // 0.5% per cycle

/**
 * Update network parameters (called by admin or sync job)
 */
export function updateNetworkParams(params: {
  avgBtcPerCycle?: bigint;
  historicalYield?: bigint;
}): void {
  if (params.avgBtcPerCycle !== undefined) {
    avgBtcPerCycleSats = params.avgBtcPerCycle;
  }
  if (params.historicalYield !== undefined) {
    historicalYieldBps = params.historicalYield;
  }
}

/**
 * Simulate BTC rewards for a given stacking amount and duration
 */
export async function simulateRewards(
  stxAmountUstx: bigint,
  lockCycles: number
): Promise<RewardSimulation> {
  // Validate inputs
  if (stxAmountUstx <= 0n) {
    throw new Error('STX amount must be positive');
  }
  if (lockCycles < config.stacking.minLockCycles || lockCycles > config.stacking.maxLockCycles) {
    throw new Error(`Lock cycles must be between ${config.stacking.minLockCycles} and ${config.stacking.maxLockCycles}`);
  }

  const stats = await getStackingStats();
  const totalStacked = stats.totalStacked;

  // Calculate user's share of the pool
  const userShareBps = totalStacked > 0n
    ? (stxAmountUstx * BPS_DENOMINATOR) / totalStacked
    : 0n;

  // Estimate BTC rewards per cycle based on share
  const btcPerCycleSats = totalStacked > 0n
    ? (avgBtcPerCycleSats * userShareBps) / BPS_DENOMINATOR
    : 0n;

  // Total estimated BTC over lock period
  const totalBtcSats = btcPerCycleSats * BigInt(lockCycles);

  // Calculate annualized yield
  const annualizedYieldBps = historicalYieldBps * BigInt(config.stacking.cyclesPerYear);

  return {
    stxAmount: stxAmountUstx,
    lockCycles,
    estimatedBtcSats: totalBtcSats,
    estimatedBtc: Number(totalBtcSats) / Number(SATS_PER_BTC),
    yieldBps: Number(historicalYieldBps),
    annualizedYieldBps: Number(annualizedYieldBps),
    userShareBps: Number(userShareBps),
  };
}

/**
 * Estimate rewards with pool fee deduction
 */
export async function simulatePoolRewards(
  stxAmountUstx: bigint,
  lockCycles: number,
  poolFeeBps: number
): Promise<{
  grossBtcSats: bigint;
  poolFeeSats: bigint;
  netBtcSats: bigint;
  poolFeeBps: number;
}> {
  const baseResult = await simulateRewards(stxAmountUstx, lockCycles);
  const grossBtc = baseResult.estimatedBtcSats;
  
  const feeSats = (grossBtc * BigInt(poolFeeBps)) / BPS_DENOMINATOR;
  const netBtc = grossBtc - feeSats;

  return {
    grossBtcSats: grossBtc,
    poolFeeSats: feeSats,
    netBtcSats: netBtc,
    poolFeeBps,
  };
}

/**
 * Compare solo stacking vs pool delegation
 */
export async function compareStackingOptions(
  stxAmountUstx: bigint,
  lockCycles: number
): Promise<DelegationComparison> {
  const stats = await getStackingStats();
  const threshold = stats.stackingThreshold;
  const meetsSoloThreshold = stxAmountUstx >= threshold;

  // Get solo estimate if threshold is met
  let soloEstimate: RewardSimulation | undefined;
  if (meetsSoloThreshold) {
    soloEstimate = await simulateRewards(stxAmountUstx, lockCycles);
  }

  // Get pool estimates for known pools
  const poolEstimates = await Promise.all(
    config.knownPools.map(async (pool) => {
      const poolResult = await simulatePoolRewards(stxAmountUstx, lockCycles, pool.feeBps);
      return {
        pool: {
          address: pool.address,
          name: pool.name,
          feeBps: pool.feeBps,
          minDelegation: 0n, // Would be fetched from contract
          totalDelegated: 0n,
          delegatorCount: 0,
          isActive: true,
        } as PoolInfo,
        netBtcSats: poolResult.netBtcSats,
        feePaid: poolResult.poolFeeSats,
      };
    })
  );

  // Find best pool option
  const bestPool = poolEstimates.reduce((best, current) =>
    current.netBtcSats > best.netBtcSats ? current : best
  );

  // Determine recommendation
  let recommendation: 'solo' | 'pool' = 'pool';
  let recommendedPool: PoolInfo | undefined = bestPool.pool;

  if (meetsSoloThreshold && soloEstimate) {
    // Compare solo vs best pool
    if (soloEstimate.estimatedBtcSats >= bestPool.netBtcSats) {
      recommendation = 'solo';
      recommendedPool = undefined;
    }
  }

  return {
    meetsSoloThreshold,
    stackingThreshold: threshold,
    soloEstimate,
    poolEstimates,
    recommendation,
    recommendedPool,
  };
}

/**
 * Calculate required STX for a target BTC reward
 */
export async function calculateRequiredStx(
  targetBtcSats: bigint,
  lockCycles: number
): Promise<{
  targetBtcSats: bigint;
  lockCycles: number;
  requiredStxUstx: bigint;
  requiredStx: number;
  requiredShareBps: bigint;
}> {
  const stats = await getStackingStats();
  const totalStacked = stats.totalStacked;

  // Required share = target / (avg * cycles)
  const totalAvgBtc = avgBtcPerCycleSats * BigInt(lockCycles);
  const requiredShareBps = totalAvgBtc > 0n
    ? (targetBtcSats * BPS_DENOMINATOR) / totalAvgBtc
    : 0n;

  // Required STX = share * total
  const requiredStxUstx = requiredShareBps > 0n
    ? (totalStacked * requiredShareBps) / BPS_DENOMINATOR
    : 0n;

  return {
    targetBtcSats,
    lockCycles,
    requiredStxUstx,
    requiredStx: Number(requiredStxUstx) / Number(USTX_PER_STX),
    requiredShareBps,
  };
}

/**
 * Get yield projections for different lock periods
 */
export async function getYieldProjections(
  stxAmountUstx: bigint
): Promise<Array<{
  lockCycles: number;
  estimatedBtcSats: bigint;
  estimatedBtc: number;
  annualizedYieldBps: number;
}>> {
  const projections = [];

  for (let cycles = 1; cycles <= config.stacking.maxLockCycles; cycles++) {
    const result = await simulateRewards(stxAmountUstx, cycles);
    projections.push({
      lockCycles: cycles,
      estimatedBtcSats: result.estimatedBtcSats,
      estimatedBtc: result.estimatedBtc,
      annualizedYieldBps: result.annualizedYieldBps,
    });
  }

  return projections;
}
