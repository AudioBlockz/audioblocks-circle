import { s3 } from "../config/s3";

const SIGNED_URL_EXPIRES = Number(process.env.SIGNED_URL_EXPIRES || 300);

// Every image path stored in the DB is a plain S3 object URL, but the bucket
// blocks public access, so the browser can't load it directly (403) — sign
// it into a short-lived URL first. Shared by anything that serves S3-backed
// image fields (song covers, artist profile/cover images) to the client.
export function signS3Url(path?: string | null): string | undefined {
  if (!path) return undefined;
  const key = path.split(".com/")[1];
  if (!key) return path;
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Expires: SIGNED_URL_EXPIRES,
  });
}
