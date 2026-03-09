// StackLens API Routes - Stacking Analytics

import { Hono } from 'hono';
import { z } from 'zod';
import {
  getPoxInfo,
  getStackingStats,
  getCurrentCycle,
  getStackingRewards,
  getExtendedAccountInfo,
  getUnlockInfo,
  getPoxTransactions,
} from '../services/stacking.service.js';
import type { ApiResponse } from '../types/index.js';

export const stackingRoutes = new Hono();

// Helper to create API response
function apiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

function apiError(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /stacking/pox
 * Get current PoX (Proof of Transfer) information
 */
stackingRoutes.get('/pox', async (c) => {
  try {
    const poxInfo = await getPoxInfo();
    return c.json(apiResponse(poxInfo));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /stacking/stats
 * Get comprehensive stacking statistics
 */
stackingRoutes.get('/stats', async (c) => {
  try {
    const stats = await getStackingStats();
    
    // Serialize BigInt values for JSON
    const serialized = {
      currentCycle: stats.currentCycle,
      totalStacked: stats.totalStacked.toString(),
      stackingThreshold: stats.stackingThreshold.toString(),
      liquidSupply: stats.liquidSupply.toString(),
      stackingRatio: stats.stackingRatio,
      avgYieldBps: stats.avgYieldBps,
      estimatedApy: stats.estimatedApy,
    };
    
    return c.json(apiResponse(serialized));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /stacking/cycle
 * Get current reward cycle information
 */
stackingRoutes.get('/cycle', async (c) => {
  try {
    const cycle = await getCurrentCycle();
    return c.json(apiResponse(cycle));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /stacking/account/:address
 * Get stacking info for a specific account
 */
stackingRoutes.get('/account/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    // Validate address format
    const addressSchema = z.string().regex(/^S[PTMN][0-9A-Z]{26,39}$/);
    const validationResult = addressSchema.safeParse(address);
    
    if (!validationResult.success) {
      return c.json(apiError('Invalid Stacks address format'), 400);
    }
    
    const accountInfo = await getExtendedAccountInfo(address);
    const unlockInfo = await getUnlockInfo(address);
    
    return c.json(apiResponse({
      address,
      balance: accountInfo.balance.toString(),
      locked: accountInfo.locked.toString(),
      isStacking: accountInfo.isStacking,
      unlock: unlockInfo,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /stacking/rewards/:address
 * Get stacking rewards for an address
 */
stackingRoutes.get('/rewards/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    const addressSchema = z.string().regex(/^S[PTMN][0-9A-Z]{26,39}$/);
    const validationResult = addressSchema.safeParse(address);
    
    if (!validationResult.success) {
      return c.json(apiError('Invalid Stacks address format'), 400);
    }
    
    const rewards = await getStackingRewards(address);
    
    // Calculate totals
    const totalRewardsSats = rewards.reduce(
      (sum, r) => sum + BigInt(r.reward_amount),
      0n
    );
    
    return c.json(apiResponse({
      address,
      totalRewardsSats: totalRewardsSats.toString(),
      totalRewardsBtc: Number(totalRewardsSats) / 100_000_000,
      rewardCount: rewards.length,
      rewards,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /stacking/pox-txs/:block
 * Get PoX-related Bitcoin transactions for a block
 */
stackingRoutes.get('/pox-txs/:block', async (c) => {
  try {
    const blockParam = c.req.param('block');
    const block = parseInt(blockParam, 10);
    
    if (isNaN(block) || block < 0) {
      return c.json(apiError('Invalid block number'), 400);
    }
    
    const transactions = await getPoxTransactions(block);
    
    return c.json(apiResponse({
      bitcoinBlock: block,
      transactionCount: transactions.length,
      transactions,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});
