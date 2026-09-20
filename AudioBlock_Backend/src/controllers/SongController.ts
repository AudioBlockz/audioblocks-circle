import { Request, Response } from "express";
import { In } from "typeorm";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import { StreamEvent } from "../entities/StreamEvent";
import { SongLike } from "../entities/SongLike";
import redis from "../config/redis";
import { precomputeSignedManifest } from "../workers/precomputeManifest";
import { handleError, getDisplayName } from "../utils/helpers";
import { signS3Url } from "../utils/s3";
import { getClientIp, lookupCountryCode, countryCodeToName } from "../utils/geo";
import { MoodMatchService } from "../services/MoodMatchService";
import { RoomTicketService } from "../services/RoomTicketService";

const moodMatchService = new MoodMatchService();
const roomTicketService = new RoomTicketService();

const RANGE_DAYS: Record<string, number> = { "7d": 7, "28d": 28, "12m": 365 };

export class SongController {

  static listSongs = async (req: Request, res: Response) => {
    try {
      const artistId = req.query.artistId as string | undefined;
      const songRepo = AppDataSource.getRepository(Song);
      // Unreleased tracks (attached to a listening Room — see Room.ts) never
      // show up in the public catalogue, regardless of processing status.
      const where: Record<string, unknown> = { status: "ready", unreleased: false };
      if (artistId) {
        where.artistId = artistId;
      }

      const songs = await songRepo.find({
        where,
        relations: ["user"],
        order: { createdAt: "DESC" },
      });

      const songIds = songs.map((s) => s.id);
      const likeRepo = AppDataSource.getRepository(SongLike);

      const likeCountRows = songIds.length
        ? await likeRepo
            .createQueryBuilder("like")
            .select("like.songId", "songId")
            .addSelect("COUNT(*)", "count")
            .where("like.songId IN (:...songIds)", { songIds })
            .groupBy("like.songId")
            .getRawMany<{ songId: string; count: string }>()
        : [];
      const likeCountMap = new Map(likeCountRows.map((r) => [r.songId, Number(r.count)]));

      // optionalAuthMiddleware attaches req.user only when a valid token is
      // present — anonymous browsing still gets like counts, just no
      // per-user "did I like this" flag.
      const userId = (req as any).user?.id as string | undefined;
      let likedSongIds = new Set<string>();
      if (userId && songIds.length) {
        const likedRows = await likeRepo.find({ where: { userId, songId: In(songIds) } });
        likedSongIds = new Set(likedRows.map((r) => r.songId));
      }

      const data = songs.map((song) => ({
        id: song.id,
        title: song.title,
        description: song.description,
        genre: song.genre,
        mood: song.mood,
        coverArtPath: signS3Url(song.coverArtPath),
        duration: song.duration,
        composers: song.composers,
        plays: song.plays,
        likeCount: likeCountMap.get(song.id) || 0,
        isLiked: likedSongIds.has(song.id),
        createdAt: song.createdAt,
        artist: {
          id: song.user?.id,
          name: song.user ? getDisplayName(song.user) : null,
          walletAddress: song.user?.walletAddress,
        },
      }));

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("List songs error:", err);
      handleError(res, err);
    }
  };

  static moodMatch = async (req: Request, res: Response) => {
    try {
      const mood = (req.body?.mood as string | undefined)?.trim();
      if (!mood) {
        return res.status(400).json({ error: "Bad Request", message: "mood is required" });
      }
      const data = await moodMatchService.matchByMood(mood);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("Mood match error:", err);
      handleError(res, err);
    }
  };

  static streamSong = async (req: Request, res: Response) => {
    const songId = req.params.id as string;
    try {
      const songRepo = AppDataSource.getRepository(Song);
      const song = await songRepo.findOne({ where: { id: songId } });
      if (!song || song.status !== "ready" || !song.hlsMasterUrl) {
        return res.status(404).json({ error: "Song not ready" });
      }

      // Unreleased tracks (see Song.unreleased) are only streamable by
      // someone with a succeeded RoomTicket for the room they belong to,
      // within that room's access window — see RoomTicketService.hasActiveAccess.
      if (song.unreleased) {
        const userId = (req as any).user?.id as string | undefined;
        const hasAccess = userId ? await roomTicketService.hasActiveAccess(userId, songId) : false;
        if (!hasAccess) {
          return res.status(403).json({ error: "Forbidden", message: "Buy a ticket to this room to listen" });
        }
      }

      // Counts once per manifest request — a reasonable "play" proxy until
      // real listen-time tracking exists. Fire-and-forget: a lost count on
      // a rare DB hiccup shouldn't break playback. The IP is used only to
      // derive a country and is never itself persisted.
      songRepo.increment({ id: songId }, "plays", 1).catch((err) =>
        console.error("Failed to increment play count:", err)
      );
      const country = lookupCountryCode(getClientIp(req));
      AppDataSource.getRepository(StreamEvent)
        .insert({ songId, artistId: song.artistId, country })
        .catch((err) => console.error("Failed to record stream event:", err));

      const cacheKey = `manifest:${songId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        return res.send(cached);
      }

      // fallback: generate on the fly (fast rewrite)
      const generated = await precomputeSignedManifest(songId);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(generated);
    } catch (err) {
      console.error("Stream error:", err);
      handleError(res, err);
    }
  };

  // Authenticated — the requesting artist's own catalogue only, including
  // non-"ready" songs (processing/failed) so they can see upload status.
  static getMyStats = async (req: Request, res: Response) => {
    try {
      const artistId = (req as any).user?.id;
      const range = RANGE_DAYS[req.query.range as string] ? (req.query.range as string) : "28d";
      const days = RANGE_DAYS[range]!;
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      since.setUTCDate(since.getUTCDate() - (days - 1));

      const songRepo = AppDataSource.getRepository(Song);
      const eventRepo = AppDataSource.getRepository(StreamEvent);

      const songs = await songRepo.find({
        where: { artistId },
        order: { plays: "DESC" },
      });

      const data = songs.map((song) => ({
        id: song.id,
        title: song.title,
        genre: song.genre,
        status: song.status,
        plays: song.plays,
        createdAt: song.createdAt,
      }));

      const totalStreams = data.reduce((sum, s) => sum + (s.plays || 0), 0);

      const trendRaw = await eventRepo
        .createQueryBuilder("e")
        .select("DATE(e.createdAt)", "date")
        .addSelect("COUNT(*)", "count")
        .where("e.artistId = :artistId", { artistId })
        .andWhere("e.createdAt >= :since", { since })
        .groupBy("DATE(e.createdAt)")
        .orderBy("DATE(e.createdAt)", "ASC")
        .getRawMany<{ date: string; count: string }>();

      // Fill in zero-stream days so the chart doesn't skip gaps.
      const countsByDate = new Map(trendRaw.map((r) => [r.date, Number(r.count)]));
      const trend: { date: string; streams: number }[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setUTCDate(since.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        trend.push({ date: key, streams: countsByDate.get(key) || 0 });
      }
      const rangeStreams = trend.reduce((sum, t) => sum + t.streams, 0);

      const countriesRaw = await eventRepo
        .createQueryBuilder("e")
        .select("e.country", "country")
        .addSelect("COUNT(*)", "count")
        .where("e.artistId = :artistId", { artistId })
        .andWhere("e.createdAt >= :since", { since })
        .groupBy("e.country")
        .orderBy("count", "DESC")
        .limit(8)
        .getRawMany<{ country: string | null; count: string }>();

      const topCountries = countriesRaw.map((r) => ({
        country: countryCodeToName(r.country || undefined),
        streams: Number(r.count),
      }));

      return res.status(200).json({
        success: true,
        data: {
          totalSongs: data.length,
          totalStreams,
          songs: data,
          range,
          rangeStreams,
          trend,
          topCountries,
        },
      });
    } catch (err) {
      console.error("Artist stats error:", err);
      handleError(res, err);
    }
  };
}
