import { ArcContractAddress } from "../../utils/arcContracts";
import { AudioBitsRegistryABI } from "../../abis/AudioBitsRegistry";
import { sendCircleContractTransaction } from "../../utils/circleWallet";

export class ArtistService {
  async setupArtistAccountOnChain(walletAddress: string, artistName: string): Promise<`0x${string}`> {
    try {
      return await sendCircleContractTransaction({
        walletAddress,
        to: ArcContractAddress.Registry,
        abi: AudioBitsRegistryABI,
        functionName: "registerArtist",
        args: [artistName],
      });
    } catch (error) {
      console.error("Error setting up artist account on-chain:", error);
      throw new Error("ArtistService: Error setting up artist account on-chain");
    }
  }
}
