import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Song } from "../entities/Song";
import { TransactionLog } from "../entities/TransactionLog";
import { Genre } from "../entities/Genre";
import { Album } from "../entities/Album";
import { StreamEvent } from "../entities/StreamEvent";
import { PoolRound } from "../entities/PoolRound";
import { PoolDeposit } from "../entities/PoolDeposit";
import { Vote } from "../entities/Vote";
import { PoolRoundResult } from "../entities/PoolRoundResult";
import { Collection } from "../entities/Collection";
import { CollectionMember } from "../entities/CollectionMember";
import { FiatDeposit } from "../entities/FiatDeposit";
import { SongLike } from "../entities/SongLike";
import { SongComment } from "../entities/SongComment";
import { Room } from "../entities/Room";
import { RoomTicket } from "../entities/RoomTicket";
import { Review } from "../entities/Review";



dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5321),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "1234",
  database: process.env.POSTGRES_DATABASE || "audioblocks",
  synchronize: true,
  dropSchema: false,
  ssl: false,
  logging: true,
  entities: [
    User,
    Song,
    TransactionLog,
    Genre,
    Album,
    StreamEvent,
    PoolRound,
    PoolDeposit,
    Vote,
    PoolRoundResult,
    Collection,
    CollectionMember,
    FiatDeposit,
    SongLike,
    SongComment,
    Room,
    RoomTicket,
    Review
  ],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "migrations",
});

export default AppDataSource;
