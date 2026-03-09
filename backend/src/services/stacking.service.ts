// StackLens - Stacking Service
// Fetches stacking data from Hiro Stacks API

import NodeCache from 'node-cache';
import { config, getApiUrl, getRewardCycleLength, getPreparePhaseLength } from '../config/index.js';
import type {
  PoxInfo,
  AccountInfo,
  StackingReward,
  RewardCycle,
  StackingStats,
  HistoricalYield,
} from '../types/index.js';

// Initialize cache
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Fetch PoX (Proof of Transfer) information
 */
export async function getPoxInfo(): Promise<PoxInfo> {
  const cacheKey = 'pox-info';
  const cached = cache.get<PoxInfo>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${getApiUrl()}/v2/pox`);
  if (!response.ok) {
    throw new Error(`Failed to fetch PoX info: ${response.statusText}`);
  }

  const data = await response.json() as PoxInfo;
  cache.set(cacheKey, data, config.cache.poxInfo);
  return data;
}

/**
 * Fetch account information including locked STX
 */
export async function getAccountInfo(address: string): Promise<AccountInfo> {
  const cacheKey = `account-${address}`;
  const cached = cache.get<AccountInfo>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${getApiUrl()}/v2/accounts/${address}?proof=0`);
  if (!response.ok) {
    throw new Error(`Failed to fetch account info: ${response.statusText}`);
  }

  const data = await response.json() as AccountInfo;
  cache.set(cacheKey, data, config.cache.accountInfo);
  return data;
}

/**
 * Fetch stacking rewards for an address
 */
export async function getStackingRewards(address: string): Promise<StackingReward[]> {
  const cacheKey = `rewards-${address}`;
  const cached = cache.get<StackingReward[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${getApiUrl()}/extended/v1/burnchain/rewards/${address}?limit=50`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch stacking rewards: ${response.statusText}`);
  }

  const result = await response.json() as { results: StackingReward[] };
  cache.set(cacheKey, result.results, config.cache.stackingRewards);
  return result.results;
}

/**
 * Get current reward cycle information
 */
export async function getCurrentCycle(): Promise<RewardCycle> {
  const pox = await getPoxInfo();
  const cycleLength = getRewardCycleLength();
  const prepareLength = getPreparePhaseLength();
  const rewardLength = cycleLength - prepareLength;

  const currentHeight = pox.current_burnchain_block_height;
  const cycleId = pox.current_cycle.id;
  
  // Calculate cycle boundaries
  const cycleStartHeight = pox.first_burnchain_block_height + (cycleId * cycleLength);
  const cycleEndHeight = cycleStartHeight + cycleLength;
  const prepareStartHeight = cycleEndHeight - prepareLength;
  
  const blocksIntoCycle = currentHeight - cycleStartHeight;
  const blocksRemaining = cycleEndHeight - currentHeight;
  const progress = (blocksIntoCycle / cycleLength) * 100;
  
  const phase = currentHeight >= prepareStartHeight ? 'prepare' : 'reward';

  return {
    id: cycleId,
    startBlockHeight: cycleStartHeight,
    endBlockHeight: cycleEndHeight,
    phase,
    blocksRemaining,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

/**
 * Get comprehensive stacking statistics
 */
export async function getStackingStats(): Promise<StackingStats> {
  const pox = await getPoxInfo();
  const currentCycle = await getCurrentCycle();

  const totalStacked = BigInt(pox.current_cycle.stacked_ustx);
  const liquidSupply = BigInt(pox.total_liquid_supply_ustx);
  const stackingThreshold = BigInt(pox.current_cycle.min_threshold_ustx);
  
  const stackingRatio = Number(totalStacked * 10000n / liquidSupply) / 100;
  
  // Estimate yield based on historical averages (placeholder - would come from contract or API)
  const avgYieldBps = 50; // 0.5% per cycle placeholder
  const estimatedApy = (avgYieldBps / 100) * config.stacking.cyclesPerYear;

  return {
    currentCycle,
    totalStacked,
    stackingThreshold,
    liquidSupply,
    stackingRatio,
    avgYieldBps,
    estimatedApy,
  };
}

/**
 * Get PoX transactions from Bitcoin
 */
export async function getPoxTransactions(bitcoinBlock: number): Promise<unknown[]> {
  const cacheKey = `pox-txs-${bitcoinBlock}`;
  const cached = cache.get<unknown[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${getApiUrl()}/extended/v2/burn-blocks/${bitcoinBlock}/pox-transactions`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch PoX transactions: ${response.statusText}`);
  }

  const data = await response.json() as { results: unknown[] };
  cache.set(cacheKey, data.results, config.cache.historicalData);
  return data.results;
}

/**
 * Get extended account info for stacking status
 */
export async function getExtendedAccountInfo(address: string): Promise<{
  balance: bigint;
  locked: bigint;
  unlockHeight: number;
  isStacking: boolean;
}> {
  const info = await getAccountInfo(address);
  
  // Parse hex balance strings
  const balance = BigInt(info.balance);
  const locked = BigInt(info.locked);
  
  return {
    balance,
    locked,
    unlockHeight: info.unlock_height,
    isStacking: locked > 0n,
  };
}

/**
 * Calculate when an account's STX will unlock
 */
export async function getUnlockInfo(address: string): Promise<{
  isLocked: boolean;
  unlockHeight: number;
  blocksUntilUnlock: number;
  estimatedUnlockDate: Date | null;
}> {
  const account = await getExtendedAccountInfo(address);
  const pox = await getPoxInfo();
  
  if (!account.isStacking || account.unlockHeight === 0) {
    return {
      isLocked: false,
      unlockHeight: 0,
      blocksUntilUnlock: 0,
      estimatedUnlockDate: null,
    };
  }
  
  const currentHeight = pox.current_burnchain_block_height;
  const blocksUntilUnlock = Math.max(0, account.unlockHeight - currentHeight);
  
  // Estimate ~10 minutes per Bitcoin block
  const minutesUntilUnlock = blocksUntilUnlock * 10;
  const estimatedUnlockDate = new Date(Date.now() + minutesUntilUnlock * 60 * 1000);
  
  return {
    isLocked: true,
    unlockHeight: account.unlockHeight,
    blocksUntilUnlock,
    estimatedUnlockDate,
  };
}

/**
 * Clear cache (for admin/testing)
 */
export function clearCache(): void {
  cache.flushAll();
}
