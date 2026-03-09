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