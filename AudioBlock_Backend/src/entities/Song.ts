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

// Set by the artist at upload time — the emotional tone(s) of the track (a
// song can carry more than one, e.g. both "energetic" and "happy"). Drives
// mood-based discovery (see MoodMatchService): a listener describes how
// they feel in free text, and an AI agent matches that against each song's
// mood tags (plus genre/description) rather than requiring an exact
// keyword match.
export enum SongMood {
  HAPPY = "happy",
  SAD = "sad",
  ENERGETIC = "energetic",
  CHILL = "chill",
  ROMANTIC = "romantic",
  ANGRY = "angry",
  NOSTALGIC = "nostalgic",
  FOCUSED = "focused",
}

@Entity("songs") // pluralize for convention
export class Song {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.songs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "artistId" }) // foreign key column
  user!: User;

  @Column()
  artistId!: string; 

  @Column()
  coverArtPath!: string; 

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  genre!: string;

  @Column({ type: "enum", enum: SongMood, array: true, nullable: true })
  mood?: SongMood[];

  @Column({ nullable: true })
  artistAddress!: string;

  @Column({ nullable: true })
  s3OriginalUrl!: string;

  @Column({ nullable: true })
  hlsMasterUrl!: string;

  @Column({ nullable: true })
  ipfsCid!: string;

  @Column({ nullable: true })
  duration!: number;

  @Column({ nullable: true })
  loudness!: number; // LUFS

  @Column({ default: "processing" })
  status!: "ai_generating" | "processing" | "ready" | "failed";

  @Column("int", { default: 0 })
  plays!: number;

  @Column({ nullable: true })
  metadataCid!: string;

  @Column({ default: false })
  isAiGenerated!: boolean;

  @Column({ nullable: true })
  aiPrompt!: string;

  @Column({ nullable: true })
  aiProvider!: string;

  @Column({ nullable: true })
  aiJobId!: string;

  @Column({ type: "json", nullable: true })
  metadata: any;

  @Column({ nullable: true })
  composers?: string;

  // Set when this song belongs to a multi-artist Collection (see
  // Collection.ts) — payout splitting for the song is then resolved via
  // that collection's CollectionMember rows instead of paying artistId alone.
  @Column({ nullable: true })
  collectionId?: string;

  // True for a track uploaded specifically for a listening Room (see
  // Room.ts) — it stays out of every public catalogue (SongController's
  // browse listing, PoolService's vote/discovery listings) and its stream
  // manifest is gated behind a paid RoomTicket instead of being publicly
  // playable. Set once, when the Room is created (RoomService.createRoom),
  // and never flipped back — a "listening party" track earns its exclusivity
  // permanently, it isn't a temporary embargo that later opens up.
  @Column({ default: false })
  unreleased!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
