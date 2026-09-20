import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// One row per stream request. Deliberately doesn't store the requester's IP
// — only the country derived from it at write time (see
// utils/geo.ts) — so this table never holds anything sensitive.
@Entity("stream_events")
export class StreamEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  songId!: string;

  // Denormalized from Song.artistId so artist-scoped trend/country queries
  // don't need a join.
  @Column()
  artistId!: string;

  // ISO 3166-1 alpha-2 country code (e.g. "NG"), or null when the IP
  // couldn't be geolocated (private/loopback addresses in local dev, or
  // unrecognized ranges).
  @Column({ nullable: true })
  country?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
