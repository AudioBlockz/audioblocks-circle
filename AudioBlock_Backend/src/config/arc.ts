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
  transport: http(),
});

export const ARC_CAIP2 = `eip155:${arc.id}` as const;
