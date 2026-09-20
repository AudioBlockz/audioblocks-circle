import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// A virtual listening party: an artist attaches one unreleased Song (see
// Song.unreleased) and opens it up for paid listening within a window they
// choose. Fans who buy a RoomTicket can stream the song and leave a Review
// while `accessStartsAt <= now <= accessEndsAt`; outside that window (or
// without a ticket) the underlying song's stream endpoint refuses them —
// see SongController.streamSong and RoomTicketService.hasActiveAccess.
@Entity("rooms")
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  artistId!: string;

  // One room, one unreleased song — a multi-track "party" would need
  // several rooms today, no separate join table.
  @Column()
  songId!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  // Base units (6 decimals, matches PaymentToken — see PoolService's
  // TOKEN_DECIMALS), string to avoid float precision loss. What a fan pays
  // to unlock the room, transferred straight to the artist's wallet at
  // purchase time (RoomTicketService) — no pool, no split, v1 is direct.
  @Column("numeric", { precision: 38, scale: 0 })
  priceUsdc!: string;

  // Artist-set access window — the "listening party" is timed access, not a
  // live synchronized session: a ticket holder can stream any time in this
  // range, on their own schedule.
  @Column("timestamptz")
  accessStartsAt!: Date;

  @Column("timestamptz")
  accessEndsAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
