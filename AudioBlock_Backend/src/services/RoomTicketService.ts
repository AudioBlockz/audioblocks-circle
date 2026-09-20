import crypto from "crypto";
import Stripe from "stripe";
import axios from "axios";
import { erc20Abi, formatUnits } from "viem";
import AppDataSource from "../config/db";
import { RoomTicket, RoomTicketProvider, RoomTicketStatus } from "../entities/RoomTicket";
import { User } from "../entities/User";
import { RoomService, TICKET_TOKEN_DECIMALS } from "./RoomService";
import { ArcContractAddress } from "../utils/arcContracts";
import { sendCircleContractTransaction } from "../utils/circleWallet";
import { TransactionLogService } from "./TransactionLogService";

// Constructed lazily — see FiatDepositService.ts's getStripe() for why (this
// module is imported by app.ts, so a synchronous throw on a missing key
// would otherwise crash the whole server at import time).
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("RoomTicketService: STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

const PAYSTACK_BASE_URL = "https://api.paystack.co";
function getPaystackSecretKey(): string {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("RoomTicketService: PAYSTACK_SECRET_KEY is not configured");
  }
  return process.env.PAYSTACK_SECRET_KEY;
}

function getNgnUsdRate(): number {
  const raw = process.env.NGN_USD_EXCHANGE_RATE;
  const rate = Number(raw);
  if (!raw || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("RoomTicketService: NGN_USD_EXCHANGE_RATE is not configured");
  }
  return rate;
}

// Ticket purchases for a Room — crypto (direct wallet-to-wallet transfer)
// and fiat (Stripe/Paystack, settled on-chain from the platform treasury on
// webhook confirmation). Unlike PoolService's deposit flow, there's no
// contract to pull funds into and no round to tally: v1 pays the artist's
// wallet directly with a single ERC20 `transfer`, no approve step, since the
// signer is moving its own balance rather than authorizing a contract to
// pull it. RoyaltyPayout.sol exists for a future split-aware version of this
// (see arcContracts.ts's note that it isn't wired to real USDC yet).
export class RoomTicketService {
  private ticketRepo = AppDataSource.getRepository(RoomTicket);
  private userRepo = AppDataSource.getRepository(User);
  private roomService = new RoomService();
  private transactionLogService = new TransactionLogService();

  async buyTicketCrypto(user: User, roomId: string) {
    const room = await this.assertPurchasable(roomId, user.id);
    const artist = await this.userRepo.findOne({ where: { id: room.artistId } });
    if (!artist) {
      throw new Error("RoomTicketService: room's artist no longer exists");
    }

    const amount = BigInt(room.priceUsdc);
    const txHash = await this.transferUsdc(user.walletAddress, artist.walletAddress, amount);

    const ticket = await this.ticketRepo.save(
      this.ticketRepo.create({
        roomId,
        userId: user.id,
        provider: RoomTicketProvider.CRYPTO,
        status: RoomTicketStatus.SUCCEEDED,
        amount: amount.toString(),
        txHash,
      })
    );

    await this.transactionLogService.createLogEntry(
      user.id,
      txHash,
      "ROOM_TICKET_PURCHASE",
      `Bought a ticket for room "${room.title}"`
    );

    return { ticketId: ticket.id, txHash, amount: formatUnits(amount, TICKET_TOKEN_DECIMALS) };
  }

  async initStripeTicket(userId: string, roomId: string) {
    const room = await this.assertPurchasable(roomId, userId);
    const amountCents = Math.round(Number(formatUnits(BigInt(room.priceUsdc), TICKET_TOKEN_DECIMALS)) * 100);

    const ticket = await this.ticketRepo.save(
      this.ticketRepo.create({
        roomId,
        userId,
        provider: RoomTicketProvider.STRIPE,
        status: RoomTicketStatus.PENDING,
        amount: room.priceUsdc,
        currency: "USD",
        fiatAmount: amountCents.toString(),
      })
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: `AudioBlocks Listening Room: ${room.title}` },
          },
          quantity: 1,
        },
      ],
      metadata: { roomTicketId: ticket.id },
      success_url: `${frontendUrl}/marketPlace/${roomId}?ticketId=${ticket.id}`,
      cancel_url: `${frontendUrl}/marketPlace/${roomId}?ticketId=${ticket.id}&cancelled=1`,
    });

    ticket.providerReference = session.id;
    await this.ticketRepo.save(ticket);

    return { checkoutUrl: session.url, ticketId: ticket.id };
  }

  // `rawBody` must be the untouched request body Stripe signed — see the
  // dedicated route in app.ts that bypasses express.json() for this path.
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const roomTicketId = session.metadata?.roomTicketId;
    if (!roomTicketId) {
      console.warn("RoomTicketService: checkout.session.completed with no roomTicketId metadata", session.id);
      return;
    }

    await this.completeFiatTicket(roomTicketId, `Stripe payment ${session.id}`);
  }

  async initPaystackTicket(userId: string, roomId: string, email: string) {
    const room = await this.assertPurchasable(roomId, userId);
    const rate = getNgnUsdRate();
    const usdAmount = Number(formatUnits(BigInt(room.priceUsdc), TICKET_TOKEN_DECIMALS));
    const amountKobo = Math.round(usdAmount * rate * 100);

    const ticket = await this.ticketRepo.save(
      this.ticketRepo.create({
        roomId,
        userId,
        provider: RoomTicketProvider.PAYSTACK,
        status: RoomTicketStatus.PENDING,
        amount: room.priceUsdc,
        currency: "NGN",
        fiatAmount: amountKobo.toString(),
        exchangeRate: rate.toString(),
      })
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const initRes = await axios.post<{ data: { authorization_url: string; reference: string } }>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amountKobo,
        currency: "NGN",
        callback_url: `${frontendUrl}/marketPlace/${roomId}?ticketId=${ticket.id}&provider=paystack`,
        metadata: { roomTicketId: ticket.id },
      },
      { headers: { Authorization: `Bearer ${getPaystackSecretKey()}` } }
    );

    const { authorization_url, reference } = initRes.data.data;
    ticket.providerReference = reference;
    await this.ticketRepo.save(ticket);

    return { checkoutUrl: authorization_url, ticketId: ticket.id };
  }

  // `rawBody` must be the untouched request body Paystack signed — same
  // reasoning as the Stripe webhook above.
  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha512", getPaystackSecretKey())
      .update(rawBody)
      .digest("hex");
    if (expectedSignature !== signature) {
      throw new Error("RoomTicketService: invalid Paystack webhook signature");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    if (event.event !== "charge.success") {
      return;
    }

    const roomTicketId = event.data?.metadata?.roomTicketId;
    if (!roomTicketId) {
      console.warn("RoomTicketService: charge.success with no roomTicketId metadata", event.data?.reference);
      return;
    }

    await this.completeFiatTicket(roomTicketId, `Paystack payment ${event.data.reference}`);
  }

  // Shared by both providers' webhooks: idempotency guard, treasury-signed
  // transfer to the artist, status bookkeeping. Both providers retry
  // webhook delivery on non-2xx responses and can send duplicate events —
  // this is what keeps a retry from paying the artist twice.
  private async completeFiatTicket(roomTicketId: string, logRef: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: roomTicketId } });
    if (!ticket || ticket.status !== RoomTicketStatus.PENDING) {
      return;
    }

    const room = await this.roomService.findRoomEntity(ticket.roomId);
    if (!room) {
      console.error(`RoomTicketService: ${logRef} succeeded but room ${ticket.roomId} no longer exists`);
      ticket.status = RoomTicketStatus.FAILED;
      await this.ticketRepo.save(ticket);
      return;
    }

    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
    if (!treasuryAddress) {
      console.error(`RoomTicketService: ${logRef} succeeded but TREASURY_WALLET_ADDRESS is not configured`);
      ticket.status = RoomTicketStatus.FAILED;
      await this.ticketRepo.save(ticket);
      return;
    }

    try {
      const artist = await this.userRepo.findOne({ where: { id: room.artistId } });
      if (!artist) throw new Error("room's artist no longer exists");

      const amount = BigInt(ticket.amount);
      const txHash = await this.transferUsdc(treasuryAddress, artist.walletAddress, amount);

      ticket.status = RoomTicketStatus.SUCCEEDED;
      ticket.txHash = txHash;
      await this.ticketRepo.save(ticket);

      await this.transactionLogService.createLogEntry(
        ticket.userId,
        txHash,
        "ROOM_TICKET_PURCHASE_FIAT",
        `Bought a ticket for room "${room.title}" via ${ticket.provider}`
      );
    } catch (err) {
      // The fan was already charged at this point — a failure here means
      // the treasury side broke (e.g. it's out of USDC), not that the
      // payment failed. Surfacing this loudly matters: it's real money
      // owed to the artist that isn't yet reflected on-chain.
      console.error(`RoomTicketService: ${logRef} succeeded but the treasury transfer failed`, err);
      ticket.status = RoomTicketStatus.FAILED;
      await this.ticketRepo.save(ticket);
    }
  }

  async getTicketStatus(ticketId: string, userId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket || ticket.userId !== userId) {
      throw new Error("RoomTicketService: ticket not found");
    }
    return { status: ticket.status, txHash: ticket.txHash ?? null };
  }

  // Gate used by SongController.streamSong for an unreleased song: is there
  // a succeeded ticket for the room this song belongs to, and are we inside
  // its access window? The room's own artist always has access.
  async hasActiveAccess(userId: string, songId: string): Promise<boolean> {
    const room = await this.roomService.findRoomBySongId(songId);
    if (!room) return false;
    if (room.artistId === userId) return true;

    const now = Date.now();
    if (now < room.accessStartsAt.getTime() || now > room.accessEndsAt.getTime()) return false;

    const ticket = await this.ticketRepo.findOne({
      where: { roomId: room.id, userId, status: RoomTicketStatus.SUCCEEDED },
    });
    return !!ticket;
  }

  private async assertPurchasable(roomId: string, userId: string) {
    const room = await this.roomService.findRoomEntity(roomId);
    if (!room) {
      throw new Error("RoomTicketService: room not found");
    }
    if (room.accessEndsAt.getTime() <= Date.now()) {
      throw new Error("RoomTicketService: this room's access window has closed");
    }

    const existing = await this.ticketRepo.findOne({
      where: { roomId, userId, status: RoomTicketStatus.SUCCEEDED },
    });
    if (existing) {
      throw new Error("RoomTicketService: you already have a ticket for this room");
    }

    return room;
  }

  // A plain wallet-to-wallet USDC transfer, signed by whichever Circle
  // wallet the caller specifies (the fan's own for a crypto purchase, the
  // platform treasury's for a fiat one) — no approve step needed, unlike
  // PoolService's approve+deposit, because nothing is pulling funds via a
  // contract; the signer is moving its own balance directly.
  private async transferUsdc(
    signerWalletAddress: string,
    toWalletAddress: string,
    amount: bigint
  ): Promise<`0x${string}`> {
    return sendCircleContractTransaction({
      walletAddress: signerWalletAddress,
      to: ArcContractAddress.PaymentToken,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toWalletAddress, amount],
    });
  }
}
