import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import { WalletController } from "../controllers/WalletController";
import { authMiddleware } from "../middlewares/authMiddleware";

const walletController = new WalletController();
const router = Router();

router.get("/balance", authMiddleware, walletController.getBalance);

export default router;