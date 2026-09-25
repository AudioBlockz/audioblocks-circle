import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("transactions_logs") // pluralize for convention
export class TransactionLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.songs, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" }) // foreign key column
  user?: User;

  // Nullable for system-triggered actions with no human actor to attribute
  // them to (e.g. PoolService.autoCloseDueRounds) — every other write here
  // still carries a real user id. type: "varchar" is explicit because
  // reflect-metadata can't reduce a `string | null` union to a single
  // constructor — without it TypeORM sees the column type as "Object" and
  // Postgres rejects it outright (matches this column's original inferred
  // type, back when it was a plain non-nullable `string`).
  @Column({ type: "varchar", nullable: true })
  user_id?: string | null;

  @Column()
  txHash!: string; 

  @Column()
  action!: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
