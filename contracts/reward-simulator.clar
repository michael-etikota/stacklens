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