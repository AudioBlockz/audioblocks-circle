import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // This app lives in a subdirectory of a larger monorepo, which also has
  // its own root package-lock.json — without this, Next.js infers the repo
  // root as the file-tracing root and pulls the whole monorepo into
  // serverless/edge function bundles (and warns about it on every build).
  outputFileTracingRoot: path.join(__dirname),
  images: {
    // Song covers live in our S3 bucket. The backend constructs URLs in two
    // different forms (with and without the region in the hostname — see
    // AudioBlock_Backend/src/workers/SongProcessorWorker.ts), so both are
    // allow-listed here rather than one broad *.amazonaws.com wildcard,
    // which would accept images from any S3 bucket, not just ours.
    remotePatterns: [
      { protocol: "https", hostname: "audioblocks-media.s3.eu-north-1.amazonaws.com" },
      { protocol: "https", hostname: "audioblocks-media.s3.amazonaws.com" },
    ],
  },
  eslint: {
    // Lint should be a separate CI check, not a deploy gate — pre-existing
    // lint errors in unrelated components shouldn't block production builds.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // WalletConnect (pulled in via @privy-io/react-auth) optionally supports
    // React Native and imports this for native storage — it's never used on
    // web, so stub it out instead of bundling/resolving it.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      // Optional peer of @privy-io/react-auth for Farcaster mini-app support —
      // we don't use it, so stub it instead of bundling/resolving it.
      "@farcaster/mini-app-solana": false,
    };
    return config;
  },
};

export default nextConfig;
