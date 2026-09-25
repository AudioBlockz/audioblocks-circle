import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("pool_deposits")
export class PoolDeposit {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  // Null when this deposit was made while no round was open — it still
  // lands in the Pool contract immediately either way (deposits aren't
  // gated on round state), it just isn't attributed to a specific round's
  // bookkeeping total until one closes and pays out. See
  // PoolService.executeDeposit.
  @Column({ nullable: true })
  roundId?: string | null;

  // Base units (18 decimals), string to avoid float precision loss.
  @Column("numeric", { precision: 38, scale: 0 })
  amount!: string;

  @Column({ nullable: true })
  approveTxHash?: string;

  @Column()
  depositTxHash!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
