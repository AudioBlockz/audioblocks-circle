import { createPublicClient, defineChain, http } from "viem";

// Arc mainnet — chain id and RPC/explorer per Arc's own docs
// (docs.arc.io/arc/references/rpc-endpoints). ARC_RPC_URL overrides the
// default Circle-hosted endpoint if you're using a permissioned third-party
// provider (Alchemy/Blockdaemon/dRPC/QuickNode) instead.
export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.ARC_RPC_URL || "https://rpc.mainnet.arc.io"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});

export const arcPublicClient = createPublicClient({
  chain: arc,
  // The default public rpc.mainnet.arc.io endpoint rate-limits (429 /
  // "rate limit exceeded") under normal admin-action traffic — closing a
  // pool round alone makes several calls here (a balance read, then
  // waitForTransactionReceipt polling). viem's default retry (3 attempts,
  // ~150ms base backoff) isn't enough headroom for a rate limit that takes
  // longer than ~1s to clear; this gives it real room to recover before
  // giving up. A dedicated RPC provider (see the ARC_RPC_URL comment
  // above) would fix the underlying cause instead of just tolerating it.
  transport: http(undefined, { retryCount: 5, retryDelay: 1000 }),
});

export const ARC_CAIP2 = `eip155:${arc.id}` as const;
