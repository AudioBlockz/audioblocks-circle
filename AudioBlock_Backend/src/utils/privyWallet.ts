import { PrivyClient } from "@privy-io/server-auth";
import { Abi, encodeFunctionData } from "viem";
import { arcPublicClient, arcTestnet, ARC_CAIP2 } from "../config/arc";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string,
  {
    walletApi: {
      authorizationPrivateKey: process.env.PRIVY_WALLET_AUTHORIZATION_PRIVATE_KEY,
    },
  }
);

// Signs and broadcasts a contract call on Arc Testnet using the Privy
// embedded wallet at `walletAddress` — the same wallet Privy creates for a
// user on login (see AuthService.sync). No server-held key material of our
// own is involved; Privy signs on the user's behalf via its wallet API.
export async function sendArcContractTransaction({
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
  const data = encodeFunctionData({ abi, functionName, args });

  const { hash } = await privy.walletApi.ethereum.sendTransaction({
    address: walletAddress,
    chainType: "ethereum",
    caip2: ARC_CAIP2,
    transaction: { to, data, chainId: arcTestnet.id },
  });

  const txHash = hash as `0x${string}`;
  await arcPublicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}
