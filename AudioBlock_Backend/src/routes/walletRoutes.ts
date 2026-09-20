import {
  Router,
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import { WalletController } from "../controllers/WalletController";
import { validateDTO } from "../middlewares/validate";
import { SignMessageDTO } from "../dtos/SignMessageDTO";
import { authMiddleware } from "../middlewares/authMiddleware";

const walletController = new WalletController();
const router = Router();


router.post("/evm/create", walletController.createEvmWallet);
router.post("/evm/signMessage", validateDTO(SignMessageDTO), walletController.signMessage);
router.get("/balance", authMiddleware, walletController.getBalance);

export default router;