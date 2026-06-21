import { Request, Response } from "express";
import { AIGenerationService } from "../services/AIGenerationService";
import { handleError } from "../utils/helpers";

const aiGenerationService = new AIGenerationService();

export class AIGenerationController {
  generateSong = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const song = await aiGenerationService.generateSong(user.id, user.walletAddress, req.body);
      return res.status(202).json({ success: true, data: song });
    } catch (err) {
      console.error("AI generation error:", err);
      handleError(res, err);
    }
  };
}
