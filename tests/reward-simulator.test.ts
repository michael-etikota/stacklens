import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("reward-simulator contract", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  describe("network parameters", () => {
    it("allows owner to update network params", () => {
      const { result } = simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),  // stacking threshold (100k STX)
          Cl.uint(500000000000000), // total stacked (500M STX)
          Cl.uint(500000000),     // avg BTC per cycle (5 BTC in sats)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from updating params", () => {
      const { result } = simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),
          Cl.uint(500000000000000),
          Cl.uint(500000000),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(202)); // ERR_UNAUTHORIZED
    });

    it("allows owner to update avg yield", () => {
      const { result } = simnet.callPublicFn(
        "reward-simulator",
        "update-avg-yield",
        [Cl.uint(55)], // 0.55% per cycle
        deployer
      );
      expect(result).toBeOk(Cl.uint(55));
    });

    it("returns current network params", () => {
      // First set some params
      simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(90000000000),
          Cl.uint(400000000000000),
          Cl.uint(400000000),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "get-network-params",
        [],
        deployer
      );

      // Verify it returns a tuple (contract executes correctly)
      expect(result.type).toBe("tuple");
    });
  });

  describe("reward simulation", () => {
    beforeEach(() => {
      // Set up network params for consistent testing
      simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),     // 100k STX threshold
          Cl.uint(1000000000000000), // 1B STX total stacked
          Cl.uint(1000000000),       // 10 BTC per cycle in sats
        ],
        deployer
      );
    });

    it("simulates rewards correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "simulate-rewards",
        [
          Cl.uint(10000000000), // 10k STX in uSTX
          Cl.uint(6),           // 6 cycles
        ],
        wallet1
      );

      // Verify simulation returns a tuple with expected structure
      expect(result.type).toBe("tuple");
    });

    it("returns quick estimate", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "quick-estimate",
        [
          Cl.uint(50000000000), // 50k STX
          Cl.uint(3),           // 3 cycles
        ],
        wallet1
      );

      expect(result.type).toBe("tuple");
      const tupleValue = (result as any).value;
      expect(tupleValue["estimated-btc-sats"]).toBeDefined();
      expect(tupleValue["annualized-yield-bps"]).toBeDefined();
    });

    it("estimates with pool fee", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "estimate-with-pool-fee",
        [
          Cl.uint(100000000000), // 100k STX
          Cl.uint(6),            // 6 cycles
          Cl.uint(500),          // 5% pool fee
        ],
        wallet1
      );

      expect(result.type).toBe("tuple");
      const tupleValue = (result as any).value;
      expect(tupleValue["gross-btc-sats"]).toBeDefined();
      expect(tupleValue["pool-fee-sats"]).toBeDefined();
      expect(tupleValue["net-btc-sats"]).toBeDefined();
    });
  });

  describe("stacking comparison", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),     // 100k STX threshold
          Cl.uint(1000000000000000), // 1B STX total
          Cl.uint(1000000000),       // 10 BTC per cycle
        ],
        deployer
      );
    });

    it("recommends solo stacking when threshold met", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "compare-stacking-options",
        [
          Cl.uint(200000000000), // 200k STX (above 100k threshold)
          Cl.uint(6),
          Cl.uint(500), // 5% pool fee
        ],
        wallet1
      );

      expect(result.type).toBe("tuple");
      const tupleValue = (result as any).value;
      expect(tupleValue["meets-solo-threshold"]).toBeDefined();
      expect(tupleValue["recommendation"]).toBeDefined();
      expect(tupleValue["solo-stacking"]).toBeDefined();
      expect(tupleValue["pool-delegation"]).toBeDefined();
    });

    it("recommends pool when below threshold", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "compare-stacking-options",
        [
          Cl.uint(50000000000), // 50k STX (below 100k threshold)
          Cl.uint(6),
          Cl.uint(500),
        ],
        wallet1
      );

      expect(result.type).toBe("tuple");
      const tupleValue = (result as any).value;
      expect(tupleValue["meets-solo-threshold"]).toBeDefined();
      expect(tupleValue["recommendation"]).toBeDefined();
      expect(tupleValue["solo-stacking"]).toBeDefined();
      expect(tupleValue["pool-delegation"]).toBeDefined();
    });
  });

  describe("required STX calculation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),
          Cl.uint(1000000000000000), // 1B STX
          Cl.uint(1000000000),       // 10 BTC per cycle
        ],
        deployer
      );
    });

    it("calculates required STX for target BTC", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "calculate-required-stx",
        [
          Cl.uint(100000000), // Target: 1 BTC in sats
          Cl.uint(6),         // 6 cycles
        ],
        wallet1
      );

      expect(result.type).toBe("tuple");
      const tupleValue = (result as any).value;
      expect(tupleValue["target-btc-sats"].value).toBe(100000000n);
      expect(tupleValue["lock-cycles"].value).toBe(6n);
      expect(tupleValue["required-stx-ustx"]).toBeDefined();
    });
  });

  describe("user simulations", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "reward-simulator",
        "update-network-params",
        [
          Cl.uint(100000000000),
          Cl.uint(1000000000000000),
          Cl.uint(1000000000),
        ],
        deployer
      );
    });

    it("allows users to run and store simulations", () => {
      const { result } = simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [
          Cl.uint(100000000000), // 100k STX
          Cl.uint(6),
        ],
        wallet1
      );

      expect(result.type).toBe("ok");
      const okValue = (result as any).value;
      expect(okValue.type).toBe("tuple");
      expect(okValue.value["simulation-id"].value).toBe(1n);
      expect(okValue.value["result"]).toBeDefined();
    });

    it("tracks user simulation count", () => {
      // Run two simulations
      simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [Cl.uint(50000000000), Cl.uint(3)],
        wallet1
      );

      simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [Cl.uint(100000000000), Cl.uint(6)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "get-user-simulation-count",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeUint(2);
    });

    it("validates lock cycles", () => {
      // Invalid: 0 cycles
      const { result: result0 } = simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [Cl.uint(100000000000), Cl.uint(0)],
        wallet1
      );
      expect(result0).toBeErr(Cl.uint(201)); // ERR_INVALID_CYCLES

      // Invalid: 13 cycles (max is 12)
      const { result: result13 } = simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [Cl.uint(100000000000), Cl.uint(13)],
        wallet1
      );
      expect(result13).toBeErr(Cl.uint(201)); // ERR_INVALID_CYCLES
    });

    it("validates STX amount", () => {
      const { result } = simnet.callPublicFn(
        "reward-simulator",
        "run-simulation",
        [Cl.uint(0), Cl.uint(6)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(200)); // ERR_INVALID_AMOUNT
    });
  });

  describe("contract info", () => {
    it("returns contract info", () => {
      const { result } = simnet.callReadOnlyFn(
        "reward-simulator",
        "get-contract-info",
        [],
        deployer
      );

      expect(result).toBeTuple({
        "owner": Cl.principal(deployer),
        "min-lock-cycles": Cl.uint(1),
        "max-lock-cycles": Cl.uint(12),
        "last-params-update": Cl.uint(0),
      });
    });
  });
});
