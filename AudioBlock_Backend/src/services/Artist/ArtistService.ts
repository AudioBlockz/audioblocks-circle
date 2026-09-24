import { erc20Abi, parseUnits } from "viem";
import { ArcContractAddress } from "../../utils/arcContracts";
import { AudioBitsRegistryABI } from "../../abis/AudioBitsRegistry";
import { sendCircleContractTransaction } from "../../utils/circleWallet";

// USDC is Arc's own gas token (see AudioBlock_Backend's Pool/RoomTicket
// services), always 6 decimals here regardless of network.
const TOKEN_DECIMALS = 6;

// A brand-new Circle wallet has zero USDC, so it can't pay for its own
// first transaction (registerArtist below) without this — comfortably
// covers gas with margin; tune via env if actual costs differ.
const ARTIST_SETUP_GAS_STIPEND = process.env.ARTIST_SETUP_GAS_STIPEND || "0.5";

export class ArtistService {
  async setupArtistAccountOnChain(walletAddress: string, artistName: string): Promise<`0x${string}`> {
    try {
      await this.fundGasStipend(walletAddress);

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

  // Sends a small USDC gas stipend from the platform treasury to a brand-
  // new artist wallet — the same TREASURY_WALLET_ADDRESS already used to
  // sign fiat-funded pool deposits and room tickets (PoolService /
  // RoomTicketService), just moving funds to the artist instead of on
  // their behalf.
  private async fundGasStipend(walletAddress: string): Promise<void> {
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
    if (!treasuryAddress) {
      throw new Error("ArtistService: TREASURY_WALLET_ADDRESS is not configured");
    }

    const amount = parseUnits(ARTIST_SETUP_GAS_STIPEND, TOKEN_DECIMALS);
    await sendCircleContractTransaction({
      walletAddress: treasuryAddress,
      to: ArcContractAddress.PaymentToken,
      abi: erc20Abi,
      functionName: "transfer",
      args: [walletAddress, amount],
    });
  }
}
