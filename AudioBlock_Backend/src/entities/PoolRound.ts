import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PoolRoundStatus {
  OPEN = "open",
  CLOSED = "closed",
}

// Rounds are a purely off-chain (backend) bookkeeping concept — the Pool
// contract itself has no notion of rounds, just a running balance. See
// PoolService.closeRound() for how a round transitions OPEN -> CLOSED.
@Entity("pool_rounds")
export class PoolRound {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  roundNumber!: number;

  @Column({ type: "enum", enum: PoolRoundStatus, default: PoolRoundStatus.OPEN })
  status!: PoolRoundStatus;

  // Base units (18 decimals, matching the payment token), stored as a
  // string to avoid JS float precision loss. Fast running total for
  // display only — the actual payout reads the contract's real balance.
  @Column("numeric", { precision: 38, scale: 0, default: 0 })
  totalDeposited!: string;

  @Column({ nullable: true })
  payoutTxHash?: string;

  @Column("numeric", { precision: 38, scale: 0, nullable: true })
  payoutAmountPerWinner?: string;

  @CreateDateColumn()
  openedAt!: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
