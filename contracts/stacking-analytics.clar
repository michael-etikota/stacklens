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

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Record a yield snapshot for a reward cycle
(define-public (record-yield-snapshot 
    (cycle uint)
    (total-stacked uint)
    (total-btc-rewards uint)
    (avg-yield-bps uint)
    (num-stackers uint)
    (snapshot-block uint))
  (begin
    ;; Authorization check
    (asserts! (can-submit-data) ERR_UNAUTHORIZED)
    ;; Validate cycle is positive
    (asserts! (> cycle u0) ERR_INVALID_CYCLE)
    ;; Check snapshot doesn't already exist
    (asserts! (is-none (map-get? yield-snapshots { cycle: cycle })) ERR_SNAPSHOT_EXISTS)
    
    ;; Store the snapshot
    (map-set yield-snapshots
      { cycle: cycle }
      {
        total-stacked: total-stacked,
        total-btc-rewards: total-btc-rewards,
        avg-yield-bps: avg-yield-bps,
        num-stackers: num-stackers,
        snapshot-block: snapshot-block,
        timestamp: stacks-block-height
      }
    )
    
    ;; Update latest cycle if needed
    (if (> cycle (var-get latest-snapshot-cycle))
      (var-set latest-snapshot-cycle cycle)
      true
    )
    
    ;; Increment total snapshots
    (var-set total-snapshots (+ (var-get total-snapshots) u1))
    
    (ok cycle)
  )
)

;; Register a new delegation pool
(define-public (register-pool
    (pool-address principal)
    (name (string-ascii 64))
    (fee-bps uint)
    (min-delegation uint))
  (begin
    (asserts! (can-submit-data) ERR_UNAUTHORIZED)
    (asserts! (<= fee-bps u10000) ERR_INVALID_AMOUNT) ;; Max 100% fee
    
    (map-set delegation-pools
      { pool-address: pool-address }
      {
        name: name,
        fee-bps: fee-bps,
        min-delegation: min-delegation,
        total-delegated: u0,
        delegator-count: u0,
        is-active: true,
        last-updated: stacks-block-height
      }
    )
    
    (ok pool-address)
  )
)

;; Update pool statistics
(define-public (update-pool-stats
    (pool-address principal)
    (total-delegated uint)
    (delegator-count uint))
  (let ((pool-data (unwrap! (map-get? delegation-pools { pool-address: pool-address }) ERR_INVALID_POOL)))
    (asserts! (can-submit-data) ERR_UNAUTHORIZED)
    
    (map-set delegation-pools
      { pool-address: pool-address }
      (merge pool-data {
        total-delegated: total-delegated,
        delegator-count: delegator-count,
        last-updated: stacks-block-height
      })
    )
    
    (ok true)
  )
)

;; Record pool cycle performance
(define-public (record-pool-cycle-stats
    (pool-address principal)
    (cycle uint)
    (stacked-amount uint)
    (btc-rewards uint)
    (yield-bps uint))
  (begin
    (asserts! (can-submit-data) ERR_UNAUTHORIZED)
    (asserts! (is-some (map-get? delegation-pools { pool-address: pool-address })) ERR_INVALID_POOL)
    
    (map-set pool-cycle-stats
      { pool-address: pool-address, cycle: cycle }
      {
        stacked-amount: stacked-amount,
        btc-rewards: btc-rewards,
        yield-bps: yield-bps
      }
    )
    
    (ok true)
  )
)

;; Add an authorized data provider
(define-public (add-provider (provider principal))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (map-set authorized-providers { provider: provider } { is-authorized: true })
    (ok provider)
  )
)

;; Remove an authorized data provider
(define-public (remove-provider (provider principal))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (map-set authorized-providers { provider: provider } { is-authorized: false })
    (ok provider)
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get yield snapshot for a specific cycle
(define-read-only (get-yield-snapshot (cycle uint))
  (map-get? yield-snapshots { cycle: cycle })
)

;; Get the latest recorded snapshot cycle
(define-read-only (get-latest-snapshot-cycle)
  (var-get latest-snapshot-cycle)
)

;; Get total number of snapshots
(define-read-only (get-total-snapshots)
  (var-get total-snapshots)
)

;; Get delegation pool info
(define-read-only (get-pool-info (pool-address principal))
  (map-get? delegation-pools { pool-address: pool-address })
)

;; Get pool cycle statistics
(define-read-only (get-pool-cycle-stats (pool-address principal) (cycle uint))
  (map-get? pool-cycle-stats { pool-address: pool-address, cycle: cycle })
)

;; Check if an address is an authorized provider
(define-read-only (is-provider-authorized (provider principal))
  (is-authorized-provider provider)
)

;; Calculate estimated APY from yield basis points
;; Assumes ~26 cycles per year (2 weeks per cycle)
(define-read-only (calculate-annual-yield (yield-bps uint))
  (let ((cycles-per-year u26))
    ;; Compound yield: ((1 + r)^26 - 1) approximated as r * 26 for simplicity
    (* yield-bps cycles-per-year)
  )
)

;; Get contract info
(define-read-only (get-contract-info)
  {
    owner: CONTRACT_OWNER,
    latest-cycle: (var-get latest-snapshot-cycle),
    total-snapshots: (var-get total-snapshots),
    is-paused: (var-get is-paused)
  }
)
