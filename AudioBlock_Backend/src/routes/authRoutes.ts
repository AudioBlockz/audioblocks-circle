import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const authController = new AuthController();
const router = Router();

router.post("/sync", authController.sync);

export default router;
