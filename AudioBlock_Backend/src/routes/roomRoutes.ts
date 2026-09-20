import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
import { ReviewController } from "../controllers/ReviewController";
import { validateDTO } from "../middlewares/validate";
import { CreateRoomDTO } from "../dtos/CreateRoomDTO";
import { InitPaystackTicketDTO } from "../dtos/InitPaystackTicketDTO";
import { AddReviewDTO } from "../dtos/AddReviewDTO";
import {
  authArtistMiddleware,
  authListenerMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/authMiddleware";

const roomController = new RoomController();
const reviewController = new ReviewController();
const router = Router();

// Public browsing
router.get("/", roomController.listRooms);
router.get("/:id", optionalAuthMiddleware, roomController.getRoom);
router.get("/:id/reviews", reviewController.listReviews);

// Artist actions
router.post("/", authArtistMiddleware, validateDTO(CreateRoomDTO), roomController.createRoom);

// Listener actions — ticket purchase
router.post("/:id/ticket/crypto", authListenerMiddleware, roomController.buyTicketCrypto);
router.post("/:id/ticket/stripe/init", authListenerMiddleware, roomController.initStripeTicket);
router.post(
  "/:id/ticket/paystack/init",
  authListenerMiddleware,
  validateDTO(InitPaystackTicketDTO),
  roomController.initPaystackTicket
);
router.get("/ticket/:ticketId/status", authListenerMiddleware, roomController.getTicketStatus);

// Listener actions — reviews (ticket ownership enforced in ReviewService)
router.post("/:id/reviews", authListenerMiddleware, validateDTO(AddReviewDTO), reviewController.addReview);

export default router;
