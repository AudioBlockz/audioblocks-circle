import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import redis from "../config/redis";
import { s3 } from "../config/s3";

const CACHE_TTL = Number(process.env.MANIFEST_CACHE_TTL || 300); // seconds
const SIGNED_EXPIRES = Number(process.env.SIGNED_URL_EXPIRES || 300);

// The base URL clients reach this API on — needed here because a
// multi-rendition (ABR) master playlist's variant lines must point back at
// *this* API (see rewriteManifest below), not directly at S3: a variant
// playlist's own segment lines are plain S3 keys until we sign them, the
// same way the top-level master's are.
const PUBLIC_API_URL =
  process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;

function getSignedUrl(key: string) {
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Expires: SIGNED_EXPIRES,
  });
}

export async function precomputeSignedManifest(songId: string) {
  const songRepo = AppDataSource.getRepository(Song);
  const song = await songRepo.findOneBy({ id: songId });

  if (!song || !song.hlsMasterUrl) throw new Error("No HLS manifest for song");

  // derive the S3 key for master.m3u8
  const masterKey = s3KeyFromUrl(song.hlsMasterUrl); // helper below

  const masterObj = await s3
    .getObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: masterKey,
    })
    .promise();
  const manifest = masterObj.Body!.toString("utf-8");

  // Everything in this manifest that isn't a variant reference (see
  // rewriteManifest) lives alongside master.m3u8 itself — same directory.
  const basePrefix = masterKey.slice(0, masterKey.lastIndexOf("/") + 1);
  const signedManifest = await rewriteManifest(manifest, songId, basePrefix);

  await redis.setex(`manifest:${songId}`, CACHE_TTL, signedManifest);
  return signedManifest;
}

// Counterpart to precomputeSignedManifest for one rendition of a
// multi-bitrate (ABR) song — see SongProcessorWorker's RENDITIONS. Each
// rendition is its own flat media playlist (plain segment lines, no nested
// variants), stored at songs/<id>/hls/<rendition>/playlist.m3u8, so this is
// really the same rewrite as the legacy single-rendition case, just scoped
// to that rendition's own S3 subdirectory instead of the song's hls/ root.
export async function precomputeSignedVariantManifest(songId: string, rendition: string) {
  const key = `songs/${songId}/hls/${rendition}/playlist.m3u8`;
  const obj = await s3
    .getObject({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key })
    .promise();
  const manifest = obj.Body!.toString("utf-8");

  const basePrefix = key.slice(0, key.lastIndexOf("/") + 1);
  const signedManifest = await rewriteManifest(manifest, songId, basePrefix);

  await redis.setex(`manifest:${songId}:${rendition}`, CACHE_TTL, signedManifest);
  return signedManifest;
}

function s3KeyFromUrl(url: string) {
  // e.g. https://bucket.s3.eu-north-1.amazonaws.com/songs/<id>/hls/master.m3u8
  const parts = url.split(".com/");
  if (parts.length < 2) throw new Error("Invalid S3 URL");
  return parts[1];
}

// Rewrites one HLS playlist so a client can actually load it:
//
// - A master (ABR) playlist's #EXT-X-STREAM-INF lines are each followed by
//   a URI naming a variant's own playlist (e.g. "128k/playlist.m3u8") — that
//   variant playlist itself still has unsigned segment lines, so instead of
//   linking straight to S3 we point back at this API's per-rendition stream
//   route, which runs this same rewrite for that variant when it's fetched.
// - Everything else is treated as a media playlist: plain segment lines
//   (relative filenames or absolute URLs — either way we only need the
//   filename), each resolved against `basePrefix` and signed directly
//   against S3. This covers both a genuine single-rendition song's flat
//   master.m3u8 (legacy, pre-ABR) and every ABR variant playlist alike.
async function rewriteManifest(manifest: string, songId: string, basePrefix: string) {
  const lines = manifest.split("\n");
  const rewritten: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXT-X-STREAM-INF")) {
      rewritten.push(line);
      const uriLine = lines[i + 1]?.trim();
      if (uriLine && !uriLine.startsWith("#")) {
        // uriLine looks like "128k/playlist.m3u8" (see SongProcessorWorker's
        // RENDITIONS + masterPlaylist) — the rendition name is the directory,
        // not the (always identical) "playlist.m3u8" filename.
        const rendition = uriLine.split("/")[0];
        rewritten.push(`${PUBLIC_API_URL}/api/song/stream/${songId}/${rendition}`);
        i++; // consumed the URI line that follows the tag
      }
      continue;
    }

    if (!line || line.startsWith("#")) {
      rewritten.push(line);
      continue;
    }

    // Segment (or, for a media playlist, itself the whole file) — sign it
    // directly against S3, scoped to this playlist's own directory.
    const filename = line.split("/").pop() || line;
    rewritten.push(getSignedUrl(`${basePrefix}${filename}`));
  }

  return rewritten.join("\n");
}
