import crypto from "crypto";
import Stripe from "stripe";
import axios from "axios";
import AppDataSource from "../config/db";
import { FiatDeposit, FiatDepositProvider, FiatDepositStatus } from "../entities/FiatDeposit";
import { PoolService } from "./Pool/PoolService";

// Constructed lazily, not at module load — the Stripe SDK throws
// synchronously if the key is empty, which would otherwise crash the whole
// server at import time (this module is pulled in by app.ts) whenever
// STRIPE_SECRET_KEY isn't set yet, not just the Stripe-specific routes.
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("FiatDepositService: STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// Paystack has no official Node SDK the way Stripe does — its API is a
// plain REST surface, so a thin axios client (checked lazily, same reason
// as getStripe() above) is all that's needed.
const PAYSTACK_BASE_URL = "https://api.paystack.co";
function getPaystackSecretKey(): string {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("FiatDepositService: PAYSTACK_SECRET_KEY is not configured");
  }
  return process.env.PAYSTACK_SECRET_KEY;
}

// NGN/USD has no fixed peg like USD/USDC — this rate is a manually
// maintained env var (same "ops responsibility" pattern as keeping the
// treasury wallet funded, see TREASURY_WALLET_ADDRESS), not a live FX feed.
// Expressed as "NGN per 1 USD".
function getNgnUsdRate(): number {
  const raw = process.env.NGN_USD_EXCHANGE_RATE;
  const rate = Number(raw);
  if (!raw || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("FiatDepositService: NGN_USD_EXCHANGE_RATE is not configured");
  }
  return rate;
}

export class FiatDepositService {
  private fiatDepositRepo = AppDataSource.getRepository(FiatDeposit);
  private poolService = new PoolService();

  // Creates the pending record first, then the Stripe Checkout Session, so
  // a failure calling Stripe never leaves an orphaned "real" payment with
  // nothing on our side to reconcile it against.
  async initStripeDeposit(userId: string, amountUsdHuman: string) {
    const amountCents = Math.round(Number(amountUsdHuman) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error("FiatDepositService: amount must be a positive number");
    }

    const round = await this.poolService.getOrOpenCurrentRound();

    const fiatDeposit = await this.fiatDepositRepo.save(
      this.fiatDepositRepo.create({
        userId,
        roundId: round.id,
        provider: FiatDepositProvider.STRIPE,
        // set right after the session exists, see below — left unset
        // (NULL, not "") so a failed Stripe call never blocks a retry, see
        // the comment on FiatDeposit.providerReference.
        currency: "USD",
        fiatAmount: amountCents.toString(),
        status: FiatDepositStatus.PENDING,
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
            product_data: { name: "AudioBlocks Community Pool Deposit" },
          },
          quantity: 1,
        },
      ],
      metadata: { fiatDepositId: fiatDeposit.id },
      success_url: `${frontendUrl}/dashboard/community?fiatDepositId=${fiatDeposit.id}`,
      cancel_url: `${frontendUrl}/dashboard/community?fiatDepositId=${fiatDeposit.id}&cancelled=1`,
    });

    fiatDeposit.providerReference = session.id;
    await this.fiatDepositRepo.save(fiatDeposit);

    return { checkoutUrl: session.url, fiatDepositId: fiatDeposit.id };
  }

  // `rawBody` must be the untouched request body Stripe signed — see the
  // dedicated route in app.ts that bypasses the global express.json()
  // parser for this one path, since a re-serialized JSON body won't match
  // the signature byte-for-byte.
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return; // not the event we act on — payment_intent events etc. are ignored
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const fiatDepositId = session.metadata?.fiatDepositId;
    if (!fiatDepositId) {
      console.warn("FiatDepositService: checkout.session.completed with no fiatDepositId metadata", session.id);
      return;
    }

    const fiatDeposit = await this.fiatDepositRepo.findOne({ where: { id: fiatDepositId } });
    if (!fiatDeposit) {
      console.warn("FiatDepositService: no FiatDeposit found for id", fiatDepositId);
      return;
    }

    // USD is pegged 1:1 with USDC — no conversion, no exchange rate to
    // snapshot. cents -> a plain decimal string PoolService expects.
    const usdcAmountHuman = (Number(fiatDeposit.fiatAmount) / 100).toFixed(2);
    await this.completeFiatDeposit(fiatDeposit, usdcAmountHuman, "1", `Stripe payment ${session.id}`);
  }

  // Creates the pending record first, then the Paystack transaction, so a
  // failure calling Paystack never leaves an orphaned "real" payment with
  // nothing on our side to reconcile it against. Mirrors initStripeDeposit.
  async initPaystackDeposit(userId: string, amountNgnHuman: string, email: string) {
    const amountKobo = Math.round(Number(amountNgnHuman) * 100);
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      throw new Error("FiatDepositService: amount must be a positive number");
    }

    const rate = getNgnUsdRate();
    const round = await this.poolService.getOrOpenCurrentRound();

    const fiatDeposit = await this.fiatDepositRepo.save(
      this.fiatDepositRepo.create({
        userId,
        roundId: round.id,
        provider: FiatDepositProvider.PAYSTACK,
        // set right after the transaction exists, see below — left unset
        // (NULL, not "") so a failed Paystack call never blocks a retry,
        // see the comment on FiatDeposit.providerReference.
        currency: "NGN",
        fiatAmount: amountKobo.toString(),
        exchangeRate: rate.toString(),
        status: FiatDepositStatus.PENDING,
      })
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const initRes = await axios.post<{ data: { authorization_url: string; reference: string } }>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amountKobo,
        currency: "NGN",
        callback_url: `${frontendUrl}/dashboard/community?fiatDepositId=${fiatDeposit.id}&provider=paystack`,
        metadata: { fiatDepositId: fiatDeposit.id },
      },
      { headers: { Authorization: `Bearer ${getPaystackSecretKey()}` } }
    );

    const { authorization_url, reference } = initRes.data.data;
    fiatDeposit.providerReference = reference;
    await this.fiatDepositRepo.save(fiatDeposit);

    return { checkoutUrl: authorization_url, fiatDepositId: fiatDeposit.id };
  }

  // `rawBody` must be the untouched request body Paystack signed — see the
  // dedicated route in app.ts that bypasses the global express.json()
  // parser for this one path, since a re-serialized JSON body's HMAC won't
  // match the signature Paystack sent byte-for-byte.
  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha512", getPaystackSecretKey())
      .update(rawBody)
      .digest("hex");
    if (expectedSignature !== signature) {
      throw new Error("FiatDepositService: invalid Paystack webhook signature");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    if (event.event !== "charge.success") {
      return; // not the event we act on
    }

    const data = event.data;
    const fiatDepositId = data?.metadata?.fiatDepositId;
    if (!fiatDepositId) {
      console.warn("FiatDepositService: charge.success with no fiatDepositId metadata", data?.reference);
      return;
    }

    const fiatDeposit = await this.fiatDepositRepo.findOne({ where: { id: fiatDepositId } });
    if (!fiatDeposit) {
      console.warn("FiatDepositService: no FiatDeposit found for id", fiatDepositId);
      return;
    }

    // Convert using the rate snapshotted at init time, not whatever
    // NGN_USD_EXCHANGE_RATE happens to be now — a rate change between
    // checkout start and webhook delivery shouldn't change what a listener
    // already agreed to pay for.
    const rate = Number(fiatDeposit.exchangeRate);
    const usdcAmountHuman = (Number(fiatDeposit.fiatAmount) / 100 / rate).toFixed(2);
    await this.completeFiatDeposit(fiatDeposit, usdcAmountHuman, fiatDeposit.exchangeRate!, `Paystack payment ${data.reference}`);
  }

  // Shared by both providers' webhooks: idempotency guard, treasury
  // deposit, and status/amount bookkeeping. Stripe/Paystack both retry
  // webhook delivery on non-2xx responses and can send duplicate events —
  // this is what keeps a retry from depositing the same payment twice.
  private async completeFiatDeposit(
    fiatDeposit: FiatDeposit,
    usdcAmountHuman: string,
    exchangeRate: string,
    logRef: string
  ) {
    if (fiatDeposit.status !== FiatDepositStatus.PENDING) {
      return;
    }

    try {
      const result = await this.poolService.depositFromTreasury(
        fiatDeposit.userId,
        usdcAmountHuman,
        fiatDeposit.roundId
      );
      fiatDeposit.status = FiatDepositStatus.SUCCEEDED;
      fiatDeposit.usdcAmount = usdcAmountHuman;
      fiatDeposit.exchangeRate = exchangeRate;
      fiatDeposit.depositTxHash = result.depositTxHash;
    } catch (err) {
      // The listener's card/account was already charged at this point — a
      // failure here means the treasury side broke (e.g. it's out of
      // USDC), not that the payment failed. Surfacing this loudly matters:
      // it's real money owed that isn't yet reflected on-chain.
      console.error(`FiatDepositService: ${logRef} succeeded but the treasury deposit failed`, err);
      fiatDeposit.status = FiatDepositStatus.FAILED;
    }

    await this.fiatDepositRepo.save(fiatDeposit);
  }

  async getStatus(fiatDepositId: string, userId: string) {
    const fiatDeposit = await this.fiatDepositRepo.findOne({ where: { id: fiatDepositId } });
    if (!fiatDeposit || fiatDeposit.userId !== userId) {
      throw new Error("FiatDepositService: deposit not found");
    }
    return {
      status: fiatDeposit.status,
      usdcAmount: fiatDeposit.usdcAmount,
      depositTxHash: fiatDeposit.depositTxHash,
    };
  }
}
