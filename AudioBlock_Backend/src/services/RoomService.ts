import { In } from "typeorm";
import { formatUnits, parseUnits } from "viem";
import AppDataSource from "../config/db";
import { Room } from "../entities/Room";
import { Song } from "../entities/Song";
import { User } from "../entities/User";
import { RoomTicket, RoomTicketStatus } from "../entities/RoomTicket";
import { Review } from "../entities/Review";
import { signS3Url } from "../utils/s3";

// Matches PoolService's TOKEN_DECIMALS — same PaymentToken (real USDC on
// Arc Testnet, 6 decimals) backs both.
export const TICKET_TOKEN_DECIMALS = 6;

export class RoomService {
  private roomRepo = AppDataSource.getRepository(Room);
  private songRepo = AppDataSource.getRepository(Song);
  private userRepo = AppDataSource.getRepository(User);
  private ticketRepo = AppDataSource.getRepository(RoomTicket);
  private reviewRepo = AppDataSource.getRepository(Review);

  async createRoom(artist: User, dto: {
    songId: string;
    title: string;
    description?: string;
    price: string;
    accessStartsAt: string;
    accessEndsAt: string;
  }) {
    const song = await this.songRepo.findOne({ where: { id: dto.songId, artistId: artist.id } });
    if (!song) {
      throw new Error("RoomService: song not found or not owned by this artist");
    }
    if (song.status === "failed") {
      throw new Error("RoomService: this track's upload failed — re-upload before opening a room for it");
    }
    // "processing"/"ai_generating" are both allowed, not just "ready": the
    // upload-for-a-room flow (CreateRoom.tsx) finalizes the upload and
    // creates the room in the same step, before transcoding has finished.
    // SongController.streamSong independently 404s until the song is
    // actually ready, so a ticket sold early just can't stream yet.

    const accessStartsAt = new Date(dto.accessStartsAt);
    const accessEndsAt = new Date(dto.accessEndsAt);
    if (accessEndsAt <= accessStartsAt) {
      throw new Error("RoomService: accessEndsAt must be after accessStartsAt");
    }
    if (accessEndsAt <= new Date()) {
      throw new Error("RoomService: accessEndsAt must be in the future");
    }

    const priceUsdc = parseUnits(dto.price, TICKET_TOKEN_DECIMALS);
    if (priceUsdc <= 0n) {
      throw new Error("RoomService: price must be greater than zero");
    }

    const room = await this.roomRepo.save(
      this.roomRepo.create({
        artistId: artist.id,
        songId: song.id,
        title: dto.title,
        description: dto.description,
        priceUsdc: priceUsdc.toString(),
        accessStartsAt,
        accessEndsAt,
      })
    );

    // Marked permanently — see the comment on Song.unreleased. Once a track
    // is attached to a room it never appears in public browse/discovery
    // again, even after this room's window closes.
    song.unreleased = true;
    await this.songRepo.save(song);

    return this.serializeRoom(room, song, artist);
  }

  async listRooms() {
    const rooms = await this.roomRepo.find({ order: { accessStartsAt: "DESC" } });
    if (rooms.length === 0) return [];

    const [songs, artists] = await Promise.all([
      this.songRepo.findBy({ id: In(rooms.map((r) => r.songId)) }),
      this.userRepo.findBy({ id: In(rooms.map((r) => r.artistId)) }),
    ]);
    const songById = new Map(songs.map((s) => [s.id, s]));
    const artistById = new Map(artists.map((a) => [a.id, a]));

    return rooms.map((r) => this.serializeRoom(r, songById.get(r.songId), artistById.get(r.artistId)));
  }

  async getRoom(roomId: string, userId?: string) {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new Error("RoomService: room not found");
    }

    const [song, artist, reviews] = await Promise.all([
      this.songRepo.findOne({ where: { id: room.songId } }),
      this.userRepo.findOne({ where: { id: room.artistId } }),
      this.reviewRepo.find({ where: { roomId }, relations: ["user"], order: { createdAt: "DESC" } }),
    ]);

    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    let hasTicket = false;
    if (userId) {
      const ticket = await this.ticketRepo.findOne({
        where: { roomId, userId, status: RoomTicketStatus.SUCCEEDED },
      });
      hasTicket = !!ticket || userId === room.artistId;
    }

    return {
      ...this.serializeRoom(room, song ?? undefined, artist ?? undefined),
      hasTicket,
      reviewCount: reviews.length,
      avgRating,
      reviews: reviews.map((rv) => ({
        id: rv.id,
        rating: rv.rating,
        content: rv.content,
        createdAt: rv.createdAt,
        user: {
          id: rv.user?.id,
          username: rv.user?.username ?? null,
          name: rv.user?.name ?? null,
          profileImage: rv.user?.profileImage ? signS3Url(rv.user.profileImage) : null,
        },
      })),
    };
  }

  // Used by RoomTicketService (to know who/where to pay) and
  // SongController.streamSong (to find the room gating a given unreleased
  // song) — internal, not exposed as its own endpoint.
  async findRoomEntity(roomId: string): Promise<Room | null> {
    return this.roomRepo.findOne({ where: { id: roomId } });
  }

  async findRoomBySongId(songId: string): Promise<Room | null> {
    return this.roomRepo.findOne({ where: { songId } });
  }

  private roomState(room: Room): "upcoming" | "live" | "closed" {
    const now = Date.now();
    if (now < room.accessStartsAt.getTime()) return "upcoming";
    if (now > room.accessEndsAt.getTime()) return "closed";
    return "live";
  }

  private serializeRoom(room: Room, song?: Song, artist?: User) {
    return {
      id: room.id,
      title: room.title,
      description: room.description ?? null,
      price: formatUnits(BigInt(room.priceUsdc), TICKET_TOKEN_DECIMALS),
      accessStartsAt: room.accessStartsAt,
      accessEndsAt: room.accessEndsAt,
      state: this.roomState(room),
      createdAt: room.createdAt,
      song: song
        ? { id: song.id, title: song.title, coverArtPath: signS3Url(song.coverArtPath), duration: song.duration }
        : null,
      artist: artist
        ? {
            id: artist.id,
            username: artist.username ?? null,
            name: artist.name ?? null,
            profileImage: artist.profileImage ? signS3Url(artist.profileImage) : null,
          }
        : { id: room.artistId, username: null, name: null, profileImage: null },
    };
  }
}
