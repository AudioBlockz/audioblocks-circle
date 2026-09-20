import { z } from "zod";
import { Agent } from "@mastra/core/agent";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import { User } from "../entities/User";
import { In } from "typeorm";
import { signS3Url } from "../utils/s3";

// Mastra's NVIDIA NIM support expects "nvidia/{catalogId}", where
// {catalogId} is the id exactly as NVIDIA's own /v1/models list returns it
// (e.g. "meta/llama-3.1-70b-instruct", or "nvidia/nemotron-3.5-lightning-30b-a3b"
// for NVIDIA-published models — note the catalog id can itself start with
// "nvidia/", which is a coincidence, not the same "nvidia/" Mastra adds for
// routing). Authenticates automatically off the NVIDIA_API_KEY env var —
// see https://mastra.ai/en/models/providers/nvidia. NVIDIA_MODEL should be
// set to the catalog id verbatim (as confirmed against /v1/models).
const NVIDIA_CATALOG_MODEL_ID = process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";
const MOOD_MATCH_MODEL = `nvidia/${NVIDIA_CATALOG_MODEL_ID}`;
const MAX_MATCHES = 5;

// Some NIM-hosted models (this one included) don't reliably honor Mastra's
// structuredOutput / response_format constraint — it can come back with no
// object at all. Asking for plain-text JSON and parsing it ourselves is
// more robust across models than depending on strict schema-following.
const matchAgent = new Agent({
  id: "mood-match-agent",
  name: "Mood Match Agent",
  instructions:
    "You match a listener's described mood or feeling to songs from a catalogue. " +
    "Each song has a title, genre, one or more fixed mood tags, and an optional description. " +
    "Pick the songs whose mood tags/genre/description best fit what the listener describes, " +
    "even if they don't use the exact same words as any mood tag — reason about the " +
    "underlying feeling. Return only song ids that were given to you in the catalogue. " +
    "Respond with ONLY a raw JSON object — no markdown code fences, no commentary — " +
    'matching this exact shape: {"matches":[{"songId":"...","reason":"..."}]}. ' +
    'If nothing fits well, respond with {"matches":[]}.',
  model: MOOD_MATCH_MODEL,
});

const matchSchema = z.object({
  matches: z.array(
    z.object({
      songId: z.string(),
      reason: z.string(),
    })
  ),
});

function parseMatchResponse(text: string): z.infer<typeof matchSchema>["matches"] {
  // Strip ```json ... ``` fences some models wrap their output in anyway,
  // despite being told not to.
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return [];

  try {
    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    const result = matchSchema.safeParse(parsed);
    return result.success ? result.data.matches : [];
  } catch {
    return [];
  }
}

export class MoodMatchService {
  private songRepo = AppDataSource.getRepository(Song);
  private userRepo = AppDataSource.getRepository(User);

  async matchByMood(moodDescription: string) {
    // unreleased: false — a Room's unreleased track (see Song.unreleased)
    // must never surface to a listener who hasn't bought a ticket, and mood
    // matching is public/anonymous, so it can't check ticket ownership the
    // way SongController.streamSong does.
    const songs = await this.songRepo.find({ where: { status: "ready", unreleased: false } });
    if (songs.length === 0) return [];

    const catalogue = songs.map((s) => ({
      id: s.id,
      title: s.title,
      genre: s.genre,
      mood: s.mood,
      description: s.description,
    }));

    const prompt =
      `Listener's mood: "${moodDescription}"\n\n` +
      `Catalogue (JSON):\n${JSON.stringify(catalogue)}\n\n` +
      `Return up to ${MAX_MATCHES} songs from the catalogue above that best match the listener's mood, ` +
      `ranked best-first, with a one-sentence reason each.`;

    // NVIDIA's shared NIM endpoint can occasionally hang indefinitely under
    // concurrent load instead of erroring — without a hard deadline here,
    // the request (and the route's own res.setTimeout) never resolves and
    // the client just sees a dropped connection. Fail fast with a clear
    // error instead.
    let response;
    try {
      response = await matchAgent.generate(prompt, {
        modelSettings: { timeout: { totalMs: 100000 } },
      });
    } catch (err) {
      throw new Error("Mood matching is taking too long right now — try again in a moment.");
    }
    const matches = parseMatchResponse(response.text ?? "");
    const songById = new Map(songs.map((s) => [s.id, s]));

    const artistIds = matches
      .map((m) => songById.get(m.songId)?.artistId)
      .filter((id): id is string => !!id);
    const artists = artistIds.length > 0 ? await this.userRepo.findBy({ id: In(artistIds) }) : [];
    const artistById = new Map(artists.map((a) => [a.id, a]));

    return matches
      .map((m) => {
        const song = songById.get(m.songId);
        if (!song) return null; // agent hallucinated an id outside the catalogue — drop it
        const artist = artistById.get(song.artistId);
        return {
          id: song.id,
          title: song.title,
          genre: song.genre,
          mood: song.mood,
          coverArtPath: signS3Url(song.coverArtPath),
          artist: {
            id: artist?.id ?? song.artistId,
            name: artist?.username || artist?.name || null,
          },
          reason: m.reason,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }
}
