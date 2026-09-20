import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum RoomTicketProvider {
  CRYPTO = "crypto",
  STRIPE = "stripe",
  PAYSTACK = "paystack",
}

export enum RoomTicketStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
}

// One row per fan's access grant to a Room — the gate SongController.streamSong
// and ReviewService check. A crypto ticket is written already SUCCEEDED (the
// on-chain transfer already happened by the time the row is created); a
// fiat ticket is written PENDING at checkout-session time and flips to
// SUCCEEDED/FAILED from the provider's webhook, mirroring FiatDeposit's
// pending-then-resolved lifecycle — but unlike FiatDeposit/PoolDeposit,
// there's no separate "confirmed" entity here, since a ticket has no round
// to tally into: this row alone is both the payment record and the access
// grant.
@Entity("room_tickets")
export class RoomTicket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  roomId!: string;

  @Column()
  userId!: string;

  @Column({ type: "enum", enum: RoomTicketProvider })
  provider!: RoomTicketProvider;

  @Column({ type: "enum", enum: RoomTicketStatus, default: RoomTicketStatus.PENDING })
  status!: RoomTicketStatus;

  // USDC value credited to the artist, base units (6 decimals) — the room's
  // priceUsdc at purchase time, kept here too in case the room's price
  // changes later (it currently can't, but this keeps the ticket
  // self-describing either way).
  @Column("numeric", { precision: 38, scale: 0 })
  amount!: string;

  // ISO 4217 code for a fiat ticket ("USD"/"NGN"); null for crypto.
  @Column({ nullable: true })
  currency?: string;

  // Minor units (cents/kobo) actually charged — null for crypto.
  @Column("numeric", { precision: 20, scale: 0, nullable: true })
  fiatAmount?: string;

  // Snapshotted at checkout time — null for USD/crypto (fixed 1:1 with USDC).
  @Column({ nullable: true })
  exchangeRate?: string;

  // The provider's own id for this payment (Stripe Checkout Session id,
  // Paystack transaction reference) — how the webhook finds its way back to
  // this row. Nullable + unique for the same reason as FiatDeposit's: the
  // row is created before the provider call that produces this value, and a
  // failed provider call shouldn't block the next real attempt.
  @Column({ unique: true, nullable: true })
  providerReference?: string;

  // On-chain transfer hash — set once the artist has actually been paid
  // (immediately for crypto, from the webhook for fiat).
  @Column({ nullable: true })
  txHash?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
