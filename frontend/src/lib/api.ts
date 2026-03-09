// StackLens API Client
// Communicates with the StackLens backend (Hono) and Hiro Stacks API

import { NETWORK_CONFIG, STACKING, type NetworkId } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PoxInfo {
  current_cycle: { id: number; min_threshold_ustx: number; stacked_ustx: number };
  next_cycle: { id: number; min_threshold_ustx: number };
  current_burnchain_block_height: number;
  contract_id: string;
  first_burnchain_block_height: number;
  reward_cycle_length: number;
  total_liquid_supply_ustx: number;
}

export interface AccountData {
  address: string;
  balance: string;
  locked: string;
  isStacking: boolean;
  unlock?: {
    unlockHeight: number;
    startCycle: number;
    lockPeriod: number;
  } | null;
}

export interface CycleData {
  id: number;
  startBlockHeight: number;
  endBlockHeight: number;
  currentBlockHeight: number;
  blocksRemaining: number;
  progress: number;
  phase: 'reward' | 'prepare';
  estimatedTimeRemaining: string;
}

export interface StatsData {
  currentCycle: number;
  totalStacked: string;
  stackingThreshold: string;
  liquidSupply: string;
  stackingRatio: number;
  avgYieldBps: number;
  estimatedApy: number;
}

export interface SimulationResult {
  stxAmount: string;
  lockCycles: number;
  estimatedBtcSats: string;
  estimatedBtc: number;
  yieldBps: number;
  annualizedYieldBps: number;
  userShareBps: number;
}

export interface PoolSimulationResult {
  grossBtcSats: string;
  poolFeeSats: string;
  netBtcSats: string;
  poolFeeBps: number;
  netBtc: number;
}

export interface ComparisonResult {
  meetsSoloThreshold: boolean;
  stackingThreshold: string;
  soloEstimate: {
    stxAmount: string;
    lockCycles: number;
    estimatedBtcSats: string;
    estimatedBtc: number;
    annualizedYieldBps: number;
  } | null;
  poolEstimates: Array<{
    pool: { name: string; address: string; feeBps: number };
    netBtcSats: string;
    netBtc: number;
    feePaid: string;
  }>;
  recommendation: string;
}

export interface RewardData {
  address: string;
  totalRewardsSats: string;
  totalRewardsBtc: number;
  rewardCount: number;
  rewards: Array<{
    reward_amount: string;
    burn_block_height: number;
    canonical: boolean;
  }>;
}

export interface ProjectionData {
  lockCycles: number;
  estimatedBtcSats: string;
  estimatedBtc: number;
  annualizedYieldBps: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBackendUrl(network: NetworkId): string {
  return NETWORK_CONFIG[network].backendUrl;
}

function getHiroUrl(network: NetworkId): string {
  return NETWORK_CONFIG[network].apiUrl;
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || 'Unknown API error');
  return json.data;
}

async function postApi<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !json.data) throw new Error(json.error || 'Unknown API error');
  return json.data;
}

// ---------------------------------------------------------------------------
// Stacking API (backend proxy)
// ---------------------------------------------------------------------------

export async function fetchPoxInfo(network: NetworkId): Promise<PoxInfo> {
  const url = `${getHiroUrl(network)}/v2/pox`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PoX API error: ${res.statusText}`);
  return res.json();
}

export async function fetchStats(network: NetworkId): Promise<StatsData> {
  return fetchApi<StatsData>(`${getBackendUrl(network)}/api/v1/stacking/stats`);
}

export async function fetchCycle(network: NetworkId): Promise<CycleData> {
  return fetchApi<CycleData>(`${getBackendUrl(network)}/api/v1/stacking/cycle`);
}

export async function fetchAccount(network: NetworkId, address: string): Promise<AccountData> {
  return fetchApi<AccountData>(`${getBackendUrl(network)}/api/v1/stacking/account/${address}`);
}

export async function fetchRewards(network: NetworkId, address: string): Promise<RewardData> {
  return fetchApi<RewardData>(`${getBackendUrl(network)}/api/v1/stacking/rewards/${address}`);
}

// ---------------------------------------------------------------------------
// Direct Hiro API calls (for data not in our backend)
// ---------------------------------------------------------------------------

export async function fetchBalances(network: NetworkId, address: string) {
  const url = `${getHiroUrl(network)}/extended/v1/address/${address}/balances`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Balances API error: ${res.statusText}`);
  return res.json() as Promise<{
    stx: { balance: string; locked: string; total_sent: string; total_received: string };
  }>;
}

export async function fetchTransactions(network: NetworkId, address: string) {
  const url = `${getHiroUrl(network)}/extended/v1/address/${address}/transactions?limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Transactions API error: ${res.statusText}`);
  return res.json() as Promise<{ results: Array<Record<string, unknown>> }>;
}

// ---------------------------------------------------------------------------
// Simulator API
// ---------------------------------------------------------------------------

export async function simulateRewards(
  network: NetworkId,
  stxAmount: number,
  lockCycles: number,
): Promise<SimulationResult> {
  return postApi<SimulationResult>(
    `${getBackendUrl(network)}/api/v1/simulator/simulate`,
    { stxAmount: (stxAmount * STACKING.MICRO_STX_PER_STX).toString(), lockCycles },
  );
}

export async function simulatePoolRewards(
  network: NetworkId,
  stxAmount: number,
  lockCycles: number,
  poolFeeBps: number,
): Promise<PoolSimulationResult> {
  return postApi<PoolSimulationResult>(
    `${getBackendUrl(network)}/api/v1/simulator/pool`,
    { stxAmount: (stxAmount * STACKING.MICRO_STX_PER_STX).toString(), lockCycles, poolFeeBps },
  );
}

export async function compareStacking(
  network: NetworkId,
  stxAmount: number,
  lockCycles: number,
): Promise<ComparisonResult> {
  return postApi<ComparisonResult>(
    `${getBackendUrl(network)}/api/v1/simulator/compare`,
    { stxAmount: (stxAmount * STACKING.MICRO_STX_PER_STX).toString(), lockCycles },
  );
}

export async function fetchProjections(
  network: NetworkId,
  stxAmount: number,
): Promise<{ stxAmount: string; projections: ProjectionData[] }> {
  const ustx = stxAmount * STACKING.MICRO_STX_PER_STX;
  return fetchApi<{ stxAmount: string; projections: ProjectionData[] }>(
    `${getBackendUrl(network)}/api/v1/simulator/projections/${ustx}`,
  );
}
