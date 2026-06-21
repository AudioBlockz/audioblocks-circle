import fs from "fs";
import path from "path";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const artifact = JSON.parse(
  fs.readFileSync(
    path.resolve("../artifacts/contracts/AudioBitsRegistry.sol/AudioBitsRegistry.json"),
    "utf-8"
  )
);

const client = initiateSmartContractPlatformClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const response = await client.deployContract({
  name: "AudioBitsRegistry",
  description: "On-chain artist and song registry",
  blockchain: "ARC-TESTNET",
  walletId: process.env.WALLET_ID!,
  abiJson: JSON.stringify(artifact.abi),
  bytecode: artifact.bytecode,
  constructorParameters: [],
  fee: { type: "level", config: { feeLevel: "MEDIUM" } },
});

console.log(JSON.stringify(response.data, null, 2));
console.log(
  "\nCopy contractId into .env as REGISTRY_CONTRACT_ID, then run `npm run check-transaction` (with TRANSACTION_ID set) " +
    "and `npm run get-contract` (with CONTRACT_ID set) to confirm deployment and get REGISTRY_CONTRACT_ADDRESS."
);
