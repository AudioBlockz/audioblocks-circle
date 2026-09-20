import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Song } from "./Song";
import { User } from "./User";

// One row per (userId, songId) — the unique constraint enforces "a listener
// can like a song at most once" at the DB level; toggling a like removes/
// re-inserts the row rather than tracking a boolean flag.
@Entity("song_likes")
@Unique(["userId", "songId"])
export class SongLike {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  songId!: string;

  @ManyToOne(() => Song, { onDelete: "CASCADE" })
  @JoinColumn({ name: "songId" })
  song!: Song;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
