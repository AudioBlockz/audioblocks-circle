import axios from "axios";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

export interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string[] | string | null;
  error: string | null;
}

function client() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN environment variable is required");

  return axios.create({
    baseURL: REPLICATE_API_BASE,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Start a MusicGen prediction for a text prompt.
 * `durationSeconds` maps to MusicGen's `duration` input (seconds of audio to generate).
 */
export async function createMusicPrediction(
  prompt: string,
  durationSeconds: number
): Promise<ReplicatePrediction> {
  const version = process.env.REPLICATE_MUSICGEN_VERSION;
  if (!version) throw new Error("REPLICATE_MUSICGEN_VERSION environment variable is required");

  const res = await client().post<ReplicatePrediction>("/predictions", {
    version,
    input: { prompt, duration: durationSeconds },
  });

  return res.data;
}

export async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const res = await client().get<ReplicatePrediction>(`/predictions/${predictionId}`);
  return res.data;
}
