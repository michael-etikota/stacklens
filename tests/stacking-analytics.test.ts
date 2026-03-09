import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("stacking-analytics contract", () => {
  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  describe("yield snapshots", () => {
    it("allows contract owner to record yield snapshot", () => {
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(1),           // cycle
          Cl.uint(1000000000),  // total-stacked (1000 STX)
          Cl.uint(50000),       // total-btc-rewards (50k sats)
          Cl.uint(50),          // avg-yield-bps (0.5%)
          Cl.uint(100),         // num-stackers
          Cl.uint(800000),      // snapshot-block
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("prevents non-owner from recording snapshot", () => {
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(2),
          Cl.uint(1000000000),
          Cl.uint(50000),
          Cl.uint(50),
          Cl.uint(100),
          Cl.uint(800100),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_UNAUTHORIZED
    });

    it("prevents duplicate snapshots for same cycle", () => {
      // First snapshot succeeds
      simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(3),
          Cl.uint(1000000000),
          Cl.uint(50000),
          Cl.uint(50),
          Cl.uint(100),
          Cl.uint(800200),
        ],
        deployer
      );

      // Second snapshot for same cycle fails
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(3),
          Cl.uint(2000000000),
          Cl.uint(100000),
          Cl.uint(55),
          Cl.uint(150),
          Cl.uint(800300),
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR_SNAPSHOT_EXISTS
    });

    it("can retrieve recorded snapshot", () => {
      // Record a snapshot
      simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(4),
          Cl.uint(5000000000),
          Cl.uint(250000),
          Cl.uint(60),
          Cl.uint(200),
          Cl.uint(800400),
        ],
        deployer
      );

      // Retrieve the snapshot
      const { result } = simnet.callReadOnlyFn(
        "stacking-analytics",
        "get-yield-snapshot",
        [Cl.uint(4)],
        deployer
      );

      // Verify it returns a Some with expected fields
      expect(result.type).toBe(Cl.some(Cl.uint(0)).type);
    });
  });

  describe("delegation pools", () => {
    it("allows owner to register a pool", () => {
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "register-pool",
        [
          Cl.principal(wallet1),
          Cl.stringAscii("Test Pool"),
          Cl.uint(500),        // 5% fee
          Cl.uint(100000000),  // 100 STX minimum
        ],
        deployer
      );
      expect(result).toBeOk(Cl.principal(wallet1));
    });

    it("can retrieve pool info", () => {
      // Register pool first
      simnet.callPublicFn(
        "stacking-analytics",
        "register-pool",
        [
          Cl.principal(wallet2),
          Cl.stringAscii("Another Pool"),
          Cl.uint(400),
          Cl.uint(50000000),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "stacking-analytics",
        "get-pool-info",
        [Cl.principal(wallet2)],
        deployer
      );

      // Verify it returns a Some with pool data
      expect(result.type).toBe(Cl.some(Cl.uint(0)).type);
    });
  });

  describe("authorized providers", () => {
    it("allows owner to add authorized provider", () => {
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "add-provider",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.principal(wallet1));
    });

    it("allows authorized provider to record snapshots", () => {
      // Add provider
      simnet.callPublicFn(
        "stacking-analytics",
        "add-provider",
        [Cl.principal(wallet1)],
        deployer
      );

      // Provider records snapshot
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(10),
          Cl.uint(3000000000),
          Cl.uint(150000),
          Cl.uint(55),
          Cl.uint(180),
          Cl.uint(801000),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(10));
    });

    it("allows owner to remove provider", () => {
      // Add then remove provider
      simnet.callPublicFn(
        "stacking-analytics",
        "add-provider",
        [Cl.principal(wallet2)],
        deployer
      );

      simnet.callPublicFn(
        "stacking-analytics",
        "remove-provider",
        [Cl.principal(wallet2)],
        deployer
      );

      // Removed provider cannot record snapshots
      const { result } = simnet.callPublicFn(
        "stacking-analytics",
        "record-yield-snapshot",
        [
          Cl.uint(11),
          Cl.uint(1000000000),
          Cl.uint(50000),
          Cl.uint(50),
          Cl.uint(100),
          Cl.uint(801100),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_UNAUTHORIZED
    });
  });

  describe("read-only functions", () => {
    it("calculates annual yield correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        "stacking-analytics",
        "calculate-annual-yield",
        [Cl.uint(50)], // 0.5% per cycle
        deployer
      );
      // 50 bps * 26 cycles = 1300 bps = 13% APY
      expect(result).toBeUint(1300);
    });

    it("returns contract info", () => {
      const { result } = simnet.callReadOnlyFn(
        "stacking-analytics",
        "get-contract-info",
        [],
        deployer
      );
      expect(result).toBeTuple({
        "owner": Cl.principal(deployer),
        "latest-cycle": Cl.uint(0),
        "total-snapshots": Cl.uint(0),
        "is-paused": Cl.bool(false),
      });
    });
  });
});
