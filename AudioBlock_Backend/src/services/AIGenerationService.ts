import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import { createMusicPrediction } from "../config/replicate";
import { getChannel } from "../config/rabbitmq";
import { GenerateSongDTO } from "../dtos/GenerateSongDTO";

const DEFAULT_DURATION_SECONDS = 8;

export class AIGenerationService {
  private songRepo: Repository<Song>;

  constructor() {
    this.songRepo = AppDataSource.getRepository(Song);
  }

  /**
   * Kick off an AI music generation job: starts a Replicate prediction, stores a
   * Song record in "ai_generating" status, and queues a job for the polling worker.
   */
  async generateSong(artistId: string, artistAddress: string, dto: GenerateSongDTO): Promise<Song> {
    const fileId = randomUUID();
    const duration = dto.durationSeconds ?? DEFAULT_DURATION_SECONDS;

    const prediction = await createMusicPrediction(dto.prompt, duration);

    const song = this.songRepo.create({
      title: dto.title,
      artistId,
      artistAddress,
      description: dto.description,
      genre: dto.genre,
      composers: dto.composers,
      coverArtPath: "",
      status: "ai_generating",
      isAiGenerated: true,
      aiPrompt: dto.prompt,
      aiProvider: "replicate",
      aiJobId: prediction.id,
    });
    await this.songRepo.save(song);

    const channel = getChannel();
    channel.sendToQueue(
      "ai_song_generation",
      Buffer.from(JSON.stringify({ songId: song.id, fileId, predictionId: prediction.id }))
    );

    return song;
  }
}
