import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// Snapshot of one round's outcome, written once at close time — gives
// "past winners" queries a clean relational read instead of re-deriving
// from pool_votes (which keeps accumulating into future rounds).
@Entity("pool_round_results")
export class PoolRoundResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  roundId!: string;

  // The song that won — nullable only because rounds closed before voting
  // became song-based have no song to point to. artistId is the credited
  // (paid) artist: the song's uploader, even when the payout itself was
  // split across a collaboration's members at close time.
  @Column({ nullable: true })
  songId?: string;

  @Column()
  artistId!: string;

  @Column("int")
  rank!: number;

  @Column("int")
  voteCount!: number;

  // Base units (18 decimals), string to avoid float precision loss.
  @Column("numeric", { precision: 38, scale: 0 })
  amountPaid!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
