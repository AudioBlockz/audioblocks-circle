import { SongService } from './../services/SongService';
import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import { getChannel } from "../config/rabbitmq";
import { s3 } from "../config/s3";
import { CacheService } from "../services/CacheService";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import { PinataService } from "../services/PinataService";
import { precomputeSignedManifest } from "./precomputeManifest";
import { TransactionLogService } from '../services/TransactionLogService';
import { keccak256 } from "viem";

const songRepo = AppDataSource.getRepository(Song);

export async function startSongWorker() {
  try {
    const channel = getChannel();

  const queue = "song_processing";

  const SongServiceInstance = new SongService();
  const logService = new TransactionLogService();

  // Ensure the queue exists before consuming
  await channel.assertQueue(queue, { durable: true });
  console.log(`🎵 Waiting for messages in queue: ${queue}`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      //   const song = await songRepo.findOneBy({ id: songId });
      const { songId, fileId } = JSON.parse(msg.content.toString());
      console.log(`Processing song ${songId}`);

      const data = JSON.parse(msg.content.toString());
      console.log("🎧 Received message:", data);

      const song = await songRepo.findOne({
        where: { id: songId },
        relations: ["user"], // load the related user (artist)
      });
      if (!song) throw new Error("Song not found");

      const localFile = path.join("uploads/merged", `${fileId}.mp3`);
      const hlsDir = `uploads/hls/${fileId}`;

      if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

      // Transcode to HLS
      await new Promise((resolve, reject) => {
        ffmpeg(localFile)
          .outputOptions([
            // Stream-copy only works when the source audio codec is
            // already TS-compatible (e.g. MP3) — it silently breaks for
            // anything else (WAV/PCM, FLAC, etc.), producing HLS segments
            // with no playable audio track at all. Re-encoding to AAC
            // handles any input format correctly.
            "-vn",
            "-c:a aac",
            "-b:a 192k",
            "-start_number 0",
            "-hls_time 10",
            "-hls_list_size 0",
            "-f hls",
          ])
          .output(path.join(hlsDir, "master.m3u8"))
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      // Upload HLS to S3
      console.log(`[${songId}] Transcode done, uploading HLS to S3...`);
      const hlsFiles = fs.readdirSync(hlsDir);
      // const s3BasePath = `songs/${fileId}/hls/`;
      const s3BasePath = `songs/${songId}/hls/`;

      for (let i = 0; i < hlsFiles.length; i++) {
        const f = hlsFiles[i];
        const filePath = path.join(hlsDir, f);
        console.log(`[${songId}] Uploading HLS file ${i + 1}/${hlsFiles.length}: ${f}`);
        // A raw file stream can't be rewound if the SDK retries the
        // request (e.g. the clock-skew correction on config/s3.ts causes
        // exactly one such retry on the first call) — a retried request
        // then hangs forever waiting for a stream that's already been
        // consumed. A Buffer has no such problem: the same bytes can be
        // resent as many times as needed.
        await s3
          .upload({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: `${s3BasePath}${f}`,
            Body: fs.readFileSync(filePath),
          })
          .promise();
      }
      console.log(`[${songId}] HLS upload done (${hlsFiles.length} files).`);

      const masterUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${s3BasePath}master.m3u8`;
      const tempCoverPath = path.join(os.tmpdir(), `${fileId}-cover.jpg`);

      // song.coverArtPath is a plain S3 object URL, but the bucket blocks
      // public access (streaming relies on signed URLs, not public ACLs —
      // see precomputeManifest.ts), so an unauthenticated GET here 403s.
      // Fetch it through the SDK, which signs the request with our IAM
      // credentials, the same way every other read/write in this file does.
      const coverKey = song.coverArtPath.split(".com/")[1];
      const coverObj = await s3
        .getObject({ Bucket: process.env.AWS_BUCKET_NAME!, Key: coverKey })
        .promise();
      fs.writeFileSync(tempCoverPath, coverObj.Body as Buffer);
      console.log(`[${songId}] Cover fetched, uploading to Pinata...`);

      // Pinata (IPFS metadata) is supplementary — the song is fully
      // playable off S3/HLS alone. If Pinata isn't configured or is
      // unreachable, don't let that block the song from going live.
      let coverCid: string | undefined;
      try {
        const coverRes = await PinataService.uploadFile(
          tempCoverPath,
          `${songId}-cover.jpg`
        );
        coverCid = coverRes.cid;
        console.log(`[${songId}] Pinata cover upload done.`);
      } catch (err) {
        console.warn(`[${songId}] Pinata cover upload failed, continuing without it:`, err);
      }

      const metadata = {
        name: song.title,
        artist: song.artistAddress,
        description: song.description,
        image: coverCid ? `ipfs://${coverCid}` : undefined,
        animation_url: masterUrl,
        attributes: [
          { trait_type: "duration", value: song.duration || 0 },
          { trait_type: "loudness", value: song.loudness || 0 },
          { trait_type: "genre", value: song.genre },
          { trait_type: "cover_url", value: coverCid },
          { trait_type: "artist_name", value: song?.user.name },
          { trait_type: "artist_username", value: song?.user.username },
          { trait_type: "Composers", value: song.composers || "" },
        ],
      };

      let metadataCid: string | undefined;
      try {
        const metadataRes = await PinataService.uploadJSON(
          metadata,
          `${songId}-metadata.json`
        );
        metadataCid = metadataRes.cid;
        console.log(`[${songId}] Pinata metadata upload done.`);
      } catch (err) {
        console.warn(`[${songId}] Pinata metadata upload failed, continuing without it:`, err);
      }

      // Update song record
      song.status = "ready";
      song.hlsMasterUrl = masterUrl;
      song.metadataCid = metadataCid ?? "";
      song.metadata = metadata;
      await songRepo.save(song);
      console.log(`[${songId}] Marked ready.`);

      await precomputeSignedManifest(song.id).catch(err => console.warn("precompute failed", err));

      await CacheService.cacheSong(songId, song);

      // Register the song on-chain, keyed by a hash of the actual audio
      // content (not the IPFS metadata CID) so AudioBitsRegistry's
      // duplicate-file check is meaningful.
      const fileHash = keccak256(fs.readFileSync(localFile));

      const txHash = await SongServiceInstance.uploadSongToBlockchain(
        song.user.id,
        song.title,
        fileHash
      ).catch((err) =>
        console.error("Blockchain upload failed for song", song.id, err)
      );

      await logService.createLogEntry(
        song.user.id,
        txHash || "",
        "SONG_PROCESSED",
        `Song with ID ${song.id} has been processed and is live.`,
      );

      fs.unlinkSync(localFile);
      fs.rmSync(hlsDir, { recursive: true, force: true });

      channel.ack(msg);
    } catch (err) {
      console.error("Worker error:", err);
      channel.nack(msg, false, false);
    }
  });
  } catch (error) {
    console.error("❌ Could not start song worker:", error);
    console.log("⚠️ Worker will retry when RabbitMQ reconnects");
  }
}
