import { Request, Response } from "express";
import { FiatDepositService } from "../services/FiatDepositService";
import { handleError } from "../utils/helpers";

const fiatDepositService = new FiatDepositService();

export class FiatDepositController {
  initStripe = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      const data = await fiatDepositService.initStripeDeposit(user.id, amount);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  // Mounted directly on the raw body in app.ts (before express.json()) —
  // req.body here is a Buffer, not a parsed object.
  stripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) {
      return res.status(400).json({ error: "Bad Request", message: "Missing stripe-signature header" });
    }
    try {
      await fiatDepositService.handleStripeWebhook(req.body as Buffer, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      // Stripe retries on non-2xx — a bad signature or malformed payload
      // should NOT be retried indefinitely, so this is a definitive 400.
      return res.status(400).json({ error: "Bad Request", message: "Webhook verification failed" });
    }
  };

  initPaystack = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount, email } = req.body;
      const data = await fiatDepositService.initPaystackDeposit(user.id, amount, email);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  // Mounted directly on the raw body in app.ts (before express.json()) —
  // req.body here is a Buffer, not a parsed object.
  paystackWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    if (!signature) {
      return res.status(400).json({ error: "Bad Request", message: "Missing x-paystack-signature header" });
    }
    try {
      await fiatDepositService.handlePaystackWebhook(req.body as Buffer, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Paystack webhook error:", error);
      // Paystack retries on non-2xx — a bad signature or malformed payload
      // should NOT be retried indefinitely, so this is a definitive 400.
      return res.status(400).json({ error: "Bad Request", message: "Webhook verification failed" });
    }
  };

  getStatus = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const id = req.params.id as string;
      const data = await fiatDepositService.getStatus(id, user.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };
}
