import AWS from "aws-sdk";
import https from "https";

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
  // The signing clock on this host can drift from AWS's, which S3 rejects
  // outright (RequestTimeTooSkewed) rather than just warning. This detects
  // the offset from a failed request's response headers and corrects
  // subsequent requests automatically instead of failing every call —
  // but only for requests the SDK itself sends and gets a response back
  // from. getSignedUrl() (used for HLS segment URLs) never makes a network
  // call at all — it's a local computation — so this alone doesn't help it;
  // see syncAwsClockOffset() below for the piece that actually covers it.
  correctClockSkew: true,
});

// getSignedUrl() signs using AWS.config.systemClockOffset directly, but
// nothing sets that offset until the SDK's own correctClockSkew has seen at
// least one failed request in this process's lifetime — and getSignedUrl()
// itself never sends one (it just computes a signature locally). On a
// freshly (re)started process, the first presigned URLs generated before any
// other S3 call happens would carry the raw, uncorrected system clock,
// silently expiring "early" relative to real time. Read S3's own Date
// response header directly (works even on a 403/400 — S3 always sends it)
// to set the offset proactively, before anything depends on it.
function syncAwsClockOffset() {
  const host = `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  https
    .get(`https://${host}/`, (res) => {
      const serverDate = res.headers.date;
      if (serverDate) {
        AWS.config.systemClockOffset = new Date(serverDate).getTime() - Date.now();
      }
      res.resume();
    })
    .on("error", () => {
      // Best-effort — correctClockSkew's own error-triggered correction
      // still applies as a fallback for actual SDK requests.
    });
}

syncAwsClockOffset();
