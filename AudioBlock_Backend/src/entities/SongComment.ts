import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Song } from "./Song";
import { User } from "./User";

@Entity("song_comments")
export class SongComment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  userId!: string;

  @Column()
  songId!: string;

  @Column("text")
  content!: string;

  @ManyToOne(() => Song, { onDelete: "CASCADE" })
  @JoinColumn({ name: "songId" })
  song!: Song;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
