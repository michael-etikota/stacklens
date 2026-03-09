;; title: reward-simulator
;; version: 1.0.0
;; summary: BTC reward simulation engine for StackLens
;; description: Provides on-chain calculations for estimating BTC stacking rewards
;;              based on stacking amount, duration, and network parameters.

;; ============================================================================
;; CONSTANTS
;; ============================================================================

;; Error codes
(define-constant ERR_INVALID_AMOUNT (err u200))
(define-constant ERR_INVALID_CYCLES (err u201))
(define-constant ERR_UNAUTHORIZED (err u202))
(define-constant ERR_PARAMS_NOT_SET (err u203))

;; Contract owner
(define-constant CONTRACT_OWNER tx-sender)

;; Stacking constraints (from PoX-4)
(define-constant MIN_LOCK_CYCLES u1)
(define-constant MAX_LOCK_CYCLES u12)

;; Basis points denominator (10000 = 100%)
(define-constant BPS_DENOMINATOR u10000)

;; Satoshis per BTC
(define-constant SATS_PER_BTC u100000000)

;; MicroSTX per STX
(define-constant USTX_PER_STX u1000000)

;; ============================================================================
;; DATA VARS
;; ============================================================================

;; Network parameters (updated by authorized sources)
(define-data-var current-stacking-threshold uint u100000000000) ;; 100k STX in uSTX
(define-data-var total-stacked-ustx uint u0)
(define-data-var avg-btc-per-cycle-sats uint u0)
(define-data-var last-params-update uint u0)

;; Historical average yields (in basis points per cycle)
(define-data-var historical-avg-yield-bps uint u50) ;; 0.5% per cycle default

;; ============================================================================
;; DATA MAPS
;; ============================================================================

;; Store simulation results for users
(define-map user-simulations
  { user: principal, simulation-id: uint }
  {
    stx-amount: uint,
    lock-cycles: uint,
    estimated-btc-sats: uint,
    estimated-yield-bps: uint,
    created-at: uint
  }
)

;; User simulation counter
(define-map user-simulation-count
  { user: principal }
  { count: uint }
)

;; Cycle-specific yield estimates (if available)
(define-map cycle-yield-estimates
  { cycle: uint }
  { yield-bps: uint }
)

;; ============================================================================
;; AUTHORIZATION HELPERS
;; ============================================================================

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Update network parameters (admin only)
(define-public (update-network-params
    (stacking-threshold uint)
    (total-stacked uint)
    (avg-btc-per-cycle uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set current-stacking-threshold stacking-threshold)
    (var-set total-stacked-ustx total-stacked)
    (var-set avg-btc-per-cycle-sats avg-btc-per-cycle)
    (var-set last-params-update stacks-block-height)
    (ok true)
  )
)

;; Update historical average yield
(define-public (update-avg-yield (yield-bps uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (var-set historical-avg-yield-bps yield-bps)
    (ok yield-bps)
  )
)

;; Set yield estimate for a specific cycle
(define-public (set-cycle-yield-estimate (cycle uint) (yield-bps uint))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (map-set cycle-yield-estimates { cycle: cycle } { yield-bps: yield-bps })
    (ok true)
  )
)

;; Run a simulation and store the result
(define-public (run-simulation (stx-amount uint) (lock-cycles uint))
  (let (
      (user tx-sender)
      (current-count (default-to u0 (get count (map-get? user-simulation-count { user: user }))))
      (new-id (+ current-count u1))
      (simulation-result (simulate-rewards stx-amount lock-cycles))
    )
    ;; Validate inputs
    (asserts! (> stx-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (and (>= lock-cycles MIN_LOCK_CYCLES) (<= lock-cycles MAX_LOCK_CYCLES)) ERR_INVALID_CYCLES)
    
    ;; Store the simulation
    (map-set user-simulations
      { user: user, simulation-id: new-id }
      {
        stx-amount: stx-amount,
        lock-cycles: lock-cycles,
        estimated-btc-sats: (get estimated-btc-sats simulation-result),
        estimated-yield-bps: (get yield-bps simulation-result),
        created-at: stacks-block-height
      }
    )
    
    ;; Update user's simulation count
    (map-set user-simulation-count { user: user } { count: new-id })
    
    (ok {
      simulation-id: new-id,
      result: simulation-result
    })
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Core simulation function - estimate BTC rewards
(define-read-only (simulate-rewards (stx-amount uint) (lock-cycles uint))
  (let (
      (total-stacked (var-get total-stacked-ustx))
      (avg-btc (var-get avg-btc-per-cycle-sats))
      (yield-bps (var-get historical-avg-yield-bps))
      ;; Calculate user's share of the pool
      (user-share-bps (if (> total-stacked u0)
                          (/ (* stx-amount BPS_DENOMINATOR) total-stacked)
                          u0))
      ;; Estimate BTC rewards per cycle based on share
      (btc-per-cycle (if (> total-stacked u0)
                         (/ (* avg-btc user-share-bps) BPS_DENOMINATOR)
                         u0))
      ;; Total estimated BTC over lock period
      (total-btc-estimate (* btc-per-cycle lock-cycles))
    )
    {
      stx-amount: stx-amount,
      lock-cycles: lock-cycles,
      user-share-bps: user-share-bps,
      btc-per-cycle-sats: btc-per-cycle,
      estimated-btc-sats: total-btc-estimate,
      yield-bps: yield-bps,
      annualized-yield-bps: (* yield-bps u26), ;; ~26 cycles per year
      network-params: {
        total-stacked: total-stacked,
        avg-btc-per-cycle: avg-btc,
        stacking-threshold: (var-get current-stacking-threshold)
      }
    }
  )
)

;; Quick estimate without storing
(define-read-only (quick-estimate (stx-amount uint) (lock-cycles uint))
  (let ((result (simulate-rewards stx-amount lock-cycles)))
    {
      estimated-btc-sats: (get estimated-btc-sats result),
      estimated-btc: (/ (get estimated-btc-sats result) SATS_PER_BTC),
      annualized-yield-bps: (get annualized-yield-bps result)
    }
  )
)

;; Estimate rewards with custom pool fee
(define-read-only (estimate-with-pool-fee (stx-amount uint) (lock-cycles uint) (pool-fee-bps uint))
  (let (
      (base-result (simulate-rewards stx-amount lock-cycles))
      (base-btc (get estimated-btc-sats base-result))
      ;; Deduct pool fee
      (fee-amount (/ (* base-btc pool-fee-bps) BPS_DENOMINATOR))
      (net-btc (- base-btc fee-amount))
    )
    {
      gross-btc-sats: base-btc,
      pool-fee-sats: fee-amount,
      net-btc-sats: net-btc,
      pool-fee-bps: pool-fee-bps
    }
  )
)

;; Compare solo stacking vs pool delegation
(define-read-only (compare-stacking-options (stx-amount uint) (lock-cycles uint) (pool-fee-bps uint))
  (let (
      (threshold (var-get current-stacking-threshold))
      (base-result (simulate-rewards stx-amount lock-cycles))
      (pool-result (estimate-with-pool-fee stx-amount lock-cycles pool-fee-bps))
      (meets-threshold (>= stx-amount threshold))
    )
    {
      meets-solo-threshold: meets-threshold,
      stacking-threshold: threshold,
      solo-stacking: (if meets-threshold
                        (some {
                          estimated-btc-sats: (get estimated-btc-sats base-result),
                          yield-bps: (get yield-bps base-result)
                        })
                        none),
      pool-delegation: {
        net-btc-sats: (get net-btc-sats pool-result),
        fee-paid-sats: (get pool-fee-sats pool-result),
        pool-fee-bps: pool-fee-bps
      },
      recommendation: (if meets-threshold "solo" "pool")
    }
  )
)

;; Get user's simulation history
(define-read-only (get-user-simulation (user principal) (simulation-id uint))
  (map-get? user-simulations { user: user, simulation-id: simulation-id })
)