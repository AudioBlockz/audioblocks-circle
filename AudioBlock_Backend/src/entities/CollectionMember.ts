import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from "typeorm";

export enum CollectionMemberStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity("collection_members")
@Unique(["collectionId", "userId"])
export class CollectionMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  collectionId!: string;

  @Column()
  userId!: string;

  // Basis points (1/100 of a percent), e.g. 2500 = 25%. A collection's
  // members must sum to 10000 — kept as an int rather than a float
  // percentage for the same reason PoolDeposit.amount is a numeric string:
  // no rounding drift once this feeds a real payout split.
  @Column("int")
  splitBps!: number;

  @Column({
    type: "enum",
    enum: CollectionMemberStatus,
    default: CollectionMemberStatus.PENDING,
  })
  status!: CollectionMemberStatus;

  @Column()
  invitedBy!: string;

  @Column({ nullable: true })
  respondedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
