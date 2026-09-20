import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum FiatDepositProvider {
  STRIPE = "stripe",
  PAYSTACK = "paystack",
}

export enum FiatDepositStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

// One row per fiat payment attempt — created at checkout-session time,
// resolved by the provider's webhook. Distinct from PoolDeposit (which only
// records confirmed on-chain transfers): a listener can abandon checkout or
// have their card declined, and this is what tracks that in-between state.
// On success, a normal PoolDeposit row is written too (see
// PoolService.depositFromTreasury) — this row keeps the payment-side
// bookkeeping (provider reference, fiat amount, exchange rate) that
// PoolDeposit was never meant to carry.
@Entity("fiat_deposits")
export class FiatDeposit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  roundId!: string;

  @Column({ type: "enum", enum: FiatDepositProvider })
  provider!: FiatDepositProvider;

  // The provider's own id for this payment (Stripe Checkout Session id,
  // Paystack transaction reference) — how the webhook finds its way back
  // to this row, and how retried webhook deliveries stay idempotent (see
  // status check in FiatDepositService). Nullable, not just optional: the
  // row is created before the provider call that produces this value, and
  // Postgres treats multiple NULLs as distinct under a unique constraint
  // (unlike multiple empty strings, which would collide) — so a failed
  // provider call never blocks the next real attempt.
  @Column({ unique: true, nullable: true })
  providerReference?: string;

  // ISO 4217 code — "USD" for now, "NGN" once Paystack lands.
  @Column()
  currency!: string;

  // Minor units (cents), string to avoid float precision loss — mirrors
  // PoolDeposit.amount's own reasoning for the same choice.
  @Column("numeric", { precision: 20, scale: 0 })
  fiatAmount!: string;

  // Snapshotted at conversion time. Null for USD (fixed 1:1 with USDC).
  @Column({ nullable: true })
  exchangeRate?: string;

  // Human-readable USDC amount actually deposited, once known.
  @Column({ nullable: true })
  usdcAmount?: string;

  @Column({
    type: "enum",
    enum: FiatDepositStatus,
    default: FiatDepositStatus.PENDING,
  })
  status!: FiatDepositStatus;

  @Column({ nullable: true })
  depositTxHash?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
