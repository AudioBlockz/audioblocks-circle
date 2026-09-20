import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { Abi, encodeFunctionData } from "viem";
import { arcPublicClient } from "../config/arc";

// Phase A of the Privy -> Circle migration (see the "Migrate Off Privy" plan).
// Privy's app is blocked from signing ANY transaction on Arc Testnet ("App
// is not authorized to transact on chain eip155:5042002"), unresolved via
// dashboard or support as of this migration. Circle is Arc's own operator —
// Arc Testnet has first-class, no-extra-authorization support in Circle's
// wallet products, and this project already has a working, tested
// integration (audiobits/circle-deploy) using the exact same SDK and
// credentials. This replaces sendArcContractTransaction() (utils/privyWallet.ts)
// for every backend/admin-triggered on-chain call.
const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const ARC_TESTNET_BLOCKCHAIN = "ARC-TESTNET";

// Signs and broadcasts a contract call on Arc Testnet using the Circle
// developer-controlled wallet at `walletAddress`. Same call shape as the
// Privy-based sendArcContractTransaction() it replaces, so call sites only
// need their import swapped.
export async function sendCircleContractTransaction({
  walletAddress,
  to,
  abi,
  functionName,
  args,
}: {
  walletAddress: string;
  to: `0x${string}`;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
}): Promise<`0x${string}`> {
  const callData = encodeFunctionData({ abi, functionName, args });

  const created = await client.createContractExecutionTransaction({
    walletAddress,
    blockchain: ARC_TESTNET_BLOCKCHAIN,
    contractAddress: to,
    callData,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const transactionId = created.data?.id;
  if (!transactionId) {
    throw new Error("Circle: contract execution did not return a transaction id");
  }

  const confirmed = await client.getTransaction({ id: transactionId, waitForState: "CONFIRMED" });
  const txHash = confirmed.data?.transaction?.txHash as `0x${string}` | undefined;
  if (!txHash) {
    throw new Error("Circle: confirmed transaction has no txHash");
  }

  // Mirrors sendArcContractTransaction()'s behavior of only returning once
  // the tx is actually mined, not just accepted by Circle's platform.
  await arcPublicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

// Creates a new Circle developer-controlled wallet on Arc Testnet under the
// given wallet set. Used to provision one wallet per artist at signup (see
// AuthService.sync()), same role Privy's embedded-wallet-per-user played.
export async function createCircleArcWallet(walletSetId: string): Promise<{ id: string; address: string }> {
  const created = await client.createWallets({
    walletSetId,
    blockchains: [ARC_TESTNET_BLOCKCHAIN],
    count: 1,
    accountType: "SCA",
  });

  const wallet = created.data?.wallets?.[0];
  if (!wallet) {
    throw new Error("Circle: wallet creation returned no wallet");
  }

  return { id: wallet.id, address: wallet.address };
}
