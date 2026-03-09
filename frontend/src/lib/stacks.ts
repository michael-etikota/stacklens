// StackLens - Stacks Connect Wallet Integration
// Uses the latest @stacks/connect `request()` / `connect()` API

import { connect, disconnect, isConnected, request } from '@stacks/connect';
import { Cl, fetchCallReadOnlyFunction, type ClarityValue } from '@stacks/transactions';
import { NETWORK_CONFIG, type NetworkId } from './constants';

// ---------------------------------------------------------------------------
// Wallet connection
// ---------------------------------------------------------------------------

export interface WalletAddress {
  address: string;
  publicKey: string;
  symbol: string;
}

export interface ConnectResult {
  addresses: WalletAddress[];
  stxAddress: string;
}

/** Prompt user to connect their Stacks wallet */
export async function connectWallet(network: NetworkId): Promise<ConnectResult> {
  const response = await connect({
    network: network === 'mainnet' ? 'mainnet' : 'testnet',
  });

  // The `addresses` array contains entries for each address type.
  // Index 2 is typically the Stacks address.
  const stxAddr = response.addresses.find(
    (a: WalletAddress) => a.symbol === 'STX',
  ) ?? response.addresses[2] ?? response.addresses[0];

  return {
    addresses: response.addresses,
    stxAddress: stxAddr?.address ?? '',
  };
}

/** Disconnect the wallet */
export function disconnectWallet() {
  disconnect();
}

/** Check if wallet is currently connected */
export function checkIsConnected(): boolean {
  return isConnected();
}

// ---------------------------------------------------------------------------
// Contract read-only calls (free, no wallet signature needed)
// ---------------------------------------------------------------------------

export async function readContractFunction(
  network: NetworkId,
  contractId: string,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress: string,
): Promise<ClarityValue> {
  const [contractAddress, contractName] = contractId.split('.');
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
    network: network === 'mainnet' ? 'mainnet' : 'testnet',
  });
}

/** Read network params from reward-simulator contract */
export async function readNetworkParams(network: NetworkId, senderAddress: string) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) return null;
  return readContractFunction(network, contractId, 'get-network-params', [], senderAddress);
}

/** Read contract info from reward-simulator */
export async function readContractInfo(network: NetworkId, senderAddress: string) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) return null;
  return readContractFunction(network, contractId, 'get-contract-info', [], senderAddress);
}

/** Simulate rewards on-chain (read-only) */
export async function readSimulateRewards(
  network: NetworkId,
  senderAddress: string,
  stxAmountUstx: bigint,
  lockCycles: number,
) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) return null;
  return readContractFunction(
    network,
    contractId,
    'simulate-rewards',
    [Cl.uint(stxAmountUstx), Cl.uint(lockCycles)],
    senderAddress,
  );
}

/** Quick estimate on-chain (read-only) */
export async function readQuickEstimate(
  network: NetworkId,
  senderAddress: string,
  stxAmountUstx: bigint,
  lockCycles: number,
) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) return null;
  return readContractFunction(
    network,
    contractId,
    'quick-estimate',
    [Cl.uint(stxAmountUstx), Cl.uint(lockCycles)],
    senderAddress,
  );
}

/** Compare stacking options on-chain (read-only) */
export async function readCompareOptions(
  network: NetworkId,
  senderAddress: string,
  stxAmountUstx: bigint,
  lockCycles: number,
  poolFeeBps: number,
) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) return null;
  return readContractFunction(
    network,
    contractId,
    'compare-stacking-options',
    [Cl.uint(stxAmountUstx), Cl.uint(lockCycles), Cl.uint(poolFeeBps)],
    senderAddress,
  );
}

// ---------------------------------------------------------------------------
// Contract write calls (requires wallet signature)
// ---------------------------------------------------------------------------

/** Run and store a simulation on-chain */
export async function callRunSimulation(
  network: NetworkId,
  stxAmountUstx: bigint,
  lockCycles: number,
) {
  const contractId = NETWORK_CONFIG[network].contracts.rewardSimulator;
  if (!contractId) throw new Error('Contract not deployed on this network');

  const result = await request('stx_callContract', {
    contract: contractId,
    functionName: 'run-simulation',
    functionArgs: [Cl.uint(stxAmountUstx), Cl.uint(lockCycles)],
    network: network === 'mainnet' ? 'mainnet' : 'testnet',
  });

  return result;
}

/** Record a yield snapshot (admin only) */
export async function callRecordYieldSnapshot(
  network: NetworkId,
  cycleId: number,
  totalStacked: bigint,
  rewardAmount: bigint,
  stackerCount: number,
) {
  const contractId = NETWORK_CONFIG[network].contracts.stackingAnalytics;
  if (!contractId) throw new Error('Contract not deployed on this network');

  const result = await request('stx_callContract', {
    contract: contractId,
    functionName: 'record-yield-snapshot',
    functionArgs: [
      Cl.uint(cycleId),
      Cl.uint(totalStacked),
      Cl.uint(rewardAmount),
      Cl.uint(stackerCount),
    ],
    network: network === 'mainnet' ? 'mainnet' : 'testnet',
  });

  return result;
}
