import fs from "fs";
import path from "path";
import axios from "axios";
import { getChannel } from "../config/rabbitmq";
import { getPrediction } from "../config/replicate";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";

const songRepo = AppDataSource.getRepository(Song);

const POLL_INTERVAL_MS = Number(process.env.AI_GENERATION_POLL_INTERVAL_MS || 5000);
const TIMEOUT_MS = Number(process.env.AI_GENERATION_TIMEOUT_MS || 5 * 60 * 1000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPrediction(predictionId: string) {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const prediction = await getPrediction(predictionId);

    if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
      return prediction;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Prediction ${predictionId} timed out after ${TIMEOUT_MS}ms`);
}

export async function startAIGenerationWorker() {
  try {
    const channel = getChannel();
    const queue = "ai_song_generation";

    await channel.assertQueue(queue, { durable: true });
    console.log(`🤖 Waiting for messages in queue: ${queue}`);

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      const { songId, fileId, predictionId } = JSON.parse(msg.content.toString());

      try {
        console.log(`Polling AI generation job ${predictionId} for song ${songId}`);

        const prediction = await waitForPrediction(predictionId);

        const song = await songRepo.findOneBy({ id: songId });
        if (!song) throw new Error("Song not found");

        if (prediction.status !== "succeeded") {
          song.status = "failed";
          await songRepo.save(song);
          throw new Error(prediction.error || `Prediction ended with status ${prediction.status}`);
        }

        const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        if (!outputUrl) throw new Error("Prediction succeeded but returned no output URL");

        const mergedDir = "uploads/merged";
        if (!fs.existsSync(mergedDir)) fs.mkdirSync(mergedDir, { recursive: true });

        const localFile = path.join(mergedDir, `${fileId}.mp3`);
        const audioRes = await axios.get<ArrayBuffer>(outputUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(localFile, Buffer.from(audioRes.data));

        // Hand off to the existing song_processing pipeline (HLS, IPFS, blockchain mint).
        song.status = "processing";
        await songRepo.save(song);

        channel.sendToQueue("song_processing", Buffer.from(JSON.stringify({ songId, fileId })));

        channel.ack(msg);
      } catch (err) {
        console.error("AI generation worker error:", err);
        channel.nack(msg, false, false);
      }
    });
  } catch (error) {
    console.error("❌ Could not start AI generation worker:", error);
    console.log("⚠️ Worker will retry when RabbitMQ reconnects");
  }
}
