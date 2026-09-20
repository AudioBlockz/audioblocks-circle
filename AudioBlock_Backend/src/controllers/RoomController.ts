import { Request, Response } from "express";
import { RoomService } from "../services/RoomService";
import { RoomTicketService } from "../services/RoomTicketService";
import { handleError } from "../utils/helpers";

export class RoomController {
  private roomService = new RoomService();
  private ticketService = new RoomTicketService();

  createRoom = async (req: Request, res: Response) => {
    try {
      const artist = (req as any).user;
      const data = await this.roomService.createRoom(artist, req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  listRooms = async (req: Request, res: Response) => {
    try {
      const data = await this.roomService.listRooms();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  getRoom = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const data = await this.roomService.getRoom(req.params.id as string, userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  buyTicketCrypto = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const data = await this.ticketService.buyTicketCrypto(user, req.params.id as string);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  initStripeTicket = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const data = await this.ticketService.initStripeTicket(user.id, req.params.id as string);
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
      await this.ticketService.handleStripeWebhook(req.body as Buffer, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Room ticket Stripe webhook error:", error);
      return res.status(400).json({ error: "Bad Request", message: "Webhook verification failed" });
    }
  };

  initPaystackTicket = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { email } = req.body;
      const data = await this.ticketService.initPaystackTicket(user.id, req.params.id as string, email);
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
      await this.ticketService.handlePaystackWebhook(req.body as Buffer, signature);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("Room ticket Paystack webhook error:", error);
      return res.status(400).json({ error: "Bad Request", message: "Webhook verification failed" });
    }
  };

  getTicketStatus = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const data = await this.ticketService.getTicketStatus(req.params.ticketId as string, user.id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };
}
