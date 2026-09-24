// Shared by every script in this directory — set ARC_NETWORK=mainnet in .env
// to target Arc mainnet (real funds); anything else (including unset)
// defaults to testnet, matching this tooling's original behavior.
export function getBlockchain(): "ARC" | "ARC-TESTNET" {
  return process.env.ARC_NETWORK === "mainnet" ? "ARC" : "ARC-TESTNET";
}
