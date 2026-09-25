import { Router } from "express";
import { PoolController } from "../controllers/PoolController";
import { FiatDepositController } from "../controllers/FiatDepositController";
import { validateDTO } from "../middlewares/validate";
import { VoteDTO } from "../dtos/VoteDTO";
import { PoolDepositDTO } from "../dtos/PoolDepositDTO";
import { InitFiatDepositDTO } from "../dtos/InitFiatDepositDTO";
import { InitPaystackDepositDTO } from "../dtos/InitPaystackDepositDTO";
import {
  authListenerMiddleware,
  authAdminMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/authMiddleware";

const poolController = new PoolController();
const fiatDepositController = new FiatDepositController();
const router = Router();

// Public browsing
router.get("/artists", poolController.listArtists);
router.get("/songs", poolController.listSongs);
router.get("/current-standings", poolController.currentStandings);
router.get("/current", optionalAuthMiddleware, poolController.getCurrentRound);
router.get("/rounds", poolController.listRounds);
router.get("/rounds/:id/results", poolController.getRoundResults);

// Listener actions
router.post("/vote", authListenerMiddleware, validateDTO(VoteDTO), poolController.vote);
router.post("/deposit", authListenerMiddleware, validateDTO(PoolDepositDTO), poolController.deposit);

// Fiat deposits — both providers' webhooks are registered directly on
// app.ts (ahead of express.json()) since Stripe/Paystack need the raw
// request body to verify their signatures; only the listener-facing
// endpoints live here.
router.post(
  "/deposit/fiat/stripe/init",
  authListenerMiddleware,
  validateDTO(InitFiatDepositDTO),
  fiatDepositController.initStripe
);
router.post(
  "/deposit/fiat/paystack/init",
  authListenerMiddleware,
  validateDTO(InitPaystackDepositDTO),
  fiatDepositController.initPaystack
);
router.get("/deposit/fiat/:id/status", authListenerMiddleware, fiatDepositController.getStatus);

// Admin
router.get("/admin/rounds", authAdminMiddleware, poolController.adminListRounds);
router.post("/admin/rounds", authAdminMiddleware, poolController.adminCreateRound);
router.post("/admin/rounds/:id/close", authAdminMiddleware, poolController.adminCloseRound);

export default router;
