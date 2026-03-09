;; title: stacking-analytics
;; version: 1.0.0
;; summary: On-chain stacking analytics and yield snapshot registry for StackLens
;; description: Stores historical yield data, delegation pool metrics, and provides
;;              analytics functions for the StackLens dashboard.

;; ============================================================================
;; CONSTANTS
;; ============================================================================

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_CYCLE (err u101))
(define-constant ERR_SNAPSHOT_EXISTS (err u102))
(define-constant ERR_SNAPSHOT_NOT_FOUND (err u103))
(define-constant ERR_INVALID_POOL (err u104))
(define-constant ERR_INVALID_AMOUNT (err u105))

;; Contract owner (deployer)
(define-constant CONTRACT_OWNER tx-sender)

;; Reward cycle length in Bitcoin blocks (mainnet = 2100, testnet = 1050)
(define-constant REWARD_CYCLE_LENGTH u2100)

;; ============================================================================
;; DATA VARS
;; ============================================================================

;; Track the latest snapshot cycle
(define-data-var latest-snapshot-cycle uint u0)

;; Total snapshots recorded
(define-data-var total-snapshots uint u0)

;; Contract pause state
(define-data-var is-paused bool false)

;; ============================================================================
;; DATA MAPS
;; ============================================================================

;; Store yield snapshots per reward cycle
(define-map yield-snapshots
  { cycle: uint }
  {
    total-stacked: uint,           ;; Total STX stacked in this cycle
    total-btc-rewards: uint,       ;; Total BTC rewards distributed (in sats)
    avg-yield-bps: uint,           ;; Average yield in basis points (1 bps = 0.01%)
    num-stackers: uint,            ;; Number of unique stackers
    snapshot-block: uint,          ;; Bitcoin block when snapshot was taken
    timestamp: uint                ;; Stacks block height when recorded
  }
)

;; Registered delegation pools
(define-map delegation-pools
  { pool-address: principal }
  {
    name: (string-ascii 64),
    fee-bps: uint,                 ;; Pool fee in basis points
    min-delegation: uint,          ;; Minimum delegation amount (uSTX)
    total-delegated: uint,         ;; Total STX delegated to pool
    delegator-count: uint,         ;; Number of delegators
    is-active: bool,
    last-updated: uint
  }
)

;; Historical pool performance per cycle
(define-map pool-cycle-stats
  { pool-address: principal, cycle: uint }
  {
    stacked-amount: uint,
    btc-rewards: uint,
    yield-bps: uint
  }
)

;; Authorized data providers (can submit snapshots)
(define-map authorized-providers
  { provider: principal }
  { is-authorized: bool }
)

;; ============================================================================
;; AUTHORIZATION HELPERS
;; ============================================================================

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (is-authorized-provider (provider principal))
  (default-to false (get is-authorized (map-get? authorized-providers { provider: provider })))
)

(define-private (can-submit-data)
  (or (is-contract-owner) (is-authorized-provider tx-sender))
)