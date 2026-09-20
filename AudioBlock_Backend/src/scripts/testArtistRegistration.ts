import dotenv from "dotenv";
dotenv.config();

import { ArtistService } from "../services/Artist/ArtistService";
import { arcPublicClient } from "../config/arc";
import { ArcContractAddress } from "../utils/arcContracts";
import { AudioBitsRegistryABI } from "../abis/AudioBitsRegistry";

const WALLET = "0x425645564C6b04bAaCe757d01c48e1dE3f29aEA4" as `0x${string}`;
const ARTIST_NAME = "Test Artist";

async function main() {
  console.log(`Registering artist "${ARTIST_NAME}" for wallet ${WALLET}...`);

  const artistService = new ArtistService();
  const txHash = await artistService.setupArtistAccountOnChain(WALLET, ARTIST_NAME);

  console.log("Transaction hash:", txHash);

  const artistId = await arcPublicClient.readContract({
    address: ArcContractAddress.Registry,
    abi: AudioBitsRegistryABI,
    functionName: "getArtistIdByWallet",
    args: [WALLET],
  });

  console.log("Registered artistId:", artistId);

  const artist = await arcPublicClient.readContract({
    address: ArcContractAddress.Registry,
    abi: AudioBitsRegistryABI,
    functionName: "getArtist",
    args: [artistId],
  });

  console.log("On-chain artist record:", artist);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
