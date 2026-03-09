// StackLens API Routes - Reward Simulator

import { Hono } from 'hono';
import { z } from 'zod';
import {
  simulateRewards,
  simulatePoolRewards,
  compareStackingOptions,
  calculateRequiredStx,
  getYieldProjections,
} from '../services/simulator.service.js';
import type { ApiResponse } from '../types/index.js';

export const simulatorRoutes = new Hono();

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

// Validation schemas
const simulateSchema = z.object({
  stxAmount: z.string().or(z.number()).transform((val) => BigInt(val)),
  lockCycles: z.number().int().min(1).max(12),
});

const poolSimulateSchema = simulateSchema.extend({
  poolFeeBps: z.number().int().min(0).max(10000),
});

const targetBtcSchema = z.object({
  targetBtcSats: z.string().or(z.number()).transform((val) => BigInt(val)),
  lockCycles: z.number().int().min(1).max(12),
});

/**
 * POST /simulator/simulate
 * Simulate BTC rewards for stacking
 */
simulatorRoutes.post('/simulate', async (c) => {
  try {
    const body = await c.req.json();
    const validation = simulateSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(apiError(`Validation error: ${validation.error.message}`), 400);
    }
    
    const { stxAmount, lockCycles } = validation.data;
    const result = await simulateRewards(stxAmount, lockCycles);
    
    return c.json(apiResponse({
      stxAmount: result.stxAmount.toString(),
      lockCycles: result.lockCycles,
      estimatedBtcSats: result.estimatedBtcSats.toString(),
      estimatedBtc: result.estimatedBtc,
      yieldBps: result.yieldBps,
      annualizedYieldBps: result.annualizedYieldBps,
      userShareBps: result.userShareBps,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /simulator/simulate
 * Simulate BTC rewards via query params (for easy testing)
 */
simulatorRoutes.get('/simulate', async (c) => {
  try {
    const stxAmount = c.req.query('stxAmount');
    const lockCycles = c.req.query('lockCycles');
    
    if (!stxAmount || !lockCycles) {
      return c.json(apiError('Missing required query params: stxAmount, lockCycles'), 400);
    }
    
    const result = await simulateRewards(
      BigInt(stxAmount),
      parseInt(lockCycles, 10)
    );
    
    return c.json(apiResponse({
      stxAmount: result.stxAmount.toString(),
      lockCycles: result.lockCycles,
      estimatedBtcSats: result.estimatedBtcSats.toString(),
      estimatedBtc: result.estimatedBtc,
      yieldBps: result.yieldBps,
      annualizedYieldBps: result.annualizedYieldBps,
      userShareBps: result.userShareBps,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * POST /simulator/pool
 * Simulate rewards with pool fee deduction
 */
simulatorRoutes.post('/pool', async (c) => {
  try {
    const body = await c.req.json();
    const validation = poolSimulateSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(apiError(`Validation error: ${validation.error.message}`), 400);
    }
    
    const { stxAmount, lockCycles, poolFeeBps } = validation.data;
    const result = await simulatePoolRewards(stxAmount, lockCycles, poolFeeBps);
    
    return c.json(apiResponse({
      grossBtcSats: result.grossBtcSats.toString(),
      poolFeeSats: result.poolFeeSats.toString(),
      netBtcSats: result.netBtcSats.toString(),
      poolFeeBps: result.poolFeeBps,
      netBtc: Number(result.netBtcSats) / 100_000_000,
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * POST /simulator/compare
 * Compare solo stacking vs pool delegation
 */
simulatorRoutes.post('/compare', async (c) => {
  try {
    const body = await c.req.json();
    const validation = simulateSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(apiError(`Validation error: ${validation.error.message}`), 400);
    }
    
    const { stxAmount, lockCycles } = validation.data;
    const comparison = await compareStackingOptions(stxAmount, lockCycles);
    
    // Serialize BigInt values
    const serialized = {
      meetsSoloThreshold: comparison.meetsSoloThreshold,
      stackingThreshold: comparison.stackingThreshold.toString(),
      soloEstimate: comparison.soloEstimate ? {
        stxAmount: comparison.soloEstimate.stxAmount.toString(),
        lockCycles: comparison.soloEstimate.lockCycles,
        estimatedBtcSats: comparison.soloEstimate.estimatedBtcSats.toString(),
        estimatedBtc: comparison.soloEstimate.estimatedBtc,
        annualizedYieldBps: comparison.soloEstimate.annualizedYieldBps,
      } : null,
      poolEstimates: comparison.poolEstimates.map((pe) => ({
        pool: {
          ...pe.pool,
          minDelegation: pe.pool.minDelegation.toString(),
          totalDelegated: pe.pool.totalDelegated.toString(),
        },
        netBtcSats: pe.netBtcSats.toString(),
        netBtc: Number(pe.netBtcSats) / 100_000_000,
        feePaid: pe.feePaid.toString(),
      })),
      recommendation: comparison.recommendation,
      recommendedPool: comparison.recommendedPool ? {
        ...comparison.recommendedPool,
        minDelegation: comparison.recommendedPool.minDelegation.toString(),
        totalDelegated: comparison.recommendedPool.totalDelegated.toString(),
      } : null,
    };
    
    return c.json(apiResponse(serialized));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * POST /simulator/required-stx
 * Calculate required STX for target BTC reward
 */
simulatorRoutes.post('/required-stx', async (c) => {
  try {
    const body = await c.req.json();
    const validation = targetBtcSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(apiError(`Validation error: ${validation.error.message}`), 400);
    }
    
    const { targetBtcSats, lockCycles } = validation.data;
    const result = await calculateRequiredStx(targetBtcSats, lockCycles);
    
    return c.json(apiResponse({
      targetBtcSats: result.targetBtcSats.toString(),
      targetBtc: Number(result.targetBtcSats) / 100_000_000,
      lockCycles: result.lockCycles,
      requiredStxUstx: result.requiredStxUstx.toString(),
      requiredStx: result.requiredStx,
      requiredShareBps: result.requiredShareBps.toString(),
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});

/**
 * GET /simulator/projections/:stxAmount
 * Get yield projections for different lock periods
 */
simulatorRoutes.get('/projections/:stxAmount', async (c) => {
  try {
    const stxAmountParam = c.req.param('stxAmount');
    const stxAmount = BigInt(stxAmountParam);
    
    if (stxAmount <= 0n) {
      return c.json(apiError('STX amount must be positive'), 400);
    }
    
    const projections = await getYieldProjections(stxAmount);
    
    return c.json(apiResponse({
      stxAmount: stxAmount.toString(),
      projections: projections.map((p) => ({
        ...p,
        estimatedBtcSats: p.estimatedBtcSats.toString(),
      })),
    }));
  } catch (error) {
    return c.json(apiError((error as Error).message), 500);
  }
});
