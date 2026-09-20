import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";

// One row per (userId, roundId) — the unique constraint is what enforces
// "exactly 1 vote per listener per round" at the DB level. Re-voting
// updates songId on the existing row rather than inserting a new one.
//
// Voting targets a song, not an artist directly — a collaboration's songs
// are credited to one uploading artist but owned by several, so voting at
// the artist level had no unambiguous way to know which collaboration (if
// any) a win applied to. Voting per song resolves that: the winning song
// itself says whether to pay one artist or split across a collection's
// members (see PoolService.closeRound).
@Entity("pool_votes")
@Unique(["userId", "roundId"])
export class Vote {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  songId!: string;

  @Column()
  roundId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
