import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Room } from "./Room";
import { User } from "./User";

// A fan's review of a Room's unreleased track — mirrors SongComment.ts's
// shape plus a star rating. Writable only by someone holding a SUCCEEDED
// RoomTicket for this room (see ReviewService.addReview): the point is
// feedback from people who actually paid to listen, not a public comment
// box anyone can post to.
@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  roomId!: string;

  @Column()
  userId!: string;

  @Column("int")
  rating!: number;

  @Column("text")
  content!: string;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room!: Room;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
