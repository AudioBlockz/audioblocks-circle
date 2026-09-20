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

  @Column()
  roundId!: string;

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
