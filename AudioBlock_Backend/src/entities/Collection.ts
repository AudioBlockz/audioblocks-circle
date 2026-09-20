import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CollectionStatus {
  DRAFT = "draft", // still waiting on invited members to accept
  ACTIVE = "active", // every member accepted, songs can be attached
  ARCHIVED = "archived",
}

@Entity("collections")
export class Collection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  creatorId!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  coverArtPath?: string;

  @Column({
    type: "enum",
    enum: CollectionStatus,
    default: CollectionStatus.DRAFT,
  })
  status!: CollectionStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
