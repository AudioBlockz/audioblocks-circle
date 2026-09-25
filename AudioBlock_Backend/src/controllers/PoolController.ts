import { Request, Response } from "express";
import { PoolService } from "../services/Pool/PoolService";
import { handleError } from "../utils/helpers";

export class PoolController {
  private poolService = new PoolService();

  listArtists = async (req: Request, res: Response) => {
    try {
      const data = await this.poolService.listArtists();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  listSongs = async (req: Request, res: Response) => {
    try {
      const data = await this.poolService.listSongs();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  currentStandings = async (req: Request, res: Response) => {
    try {
      const data = await this.poolService.getCurrentStandings();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  getCurrentRound = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const data = await this.poolService.getCurrentRoundStatus(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  vote = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { songId } = req.body;
      await this.poolService.castVote(userId, songId);
      return res.status(200).json({ success: true, message: "Vote recorded" });
    } catch (error) {
      handleError(res, error);
    }
  };

  deposit = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      const data = await this.poolService.deposit(user, amount);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  listRounds = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await this.poolService.listClosedRounds(limit);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  getRoundResults = async (req: Request, res: Response) => {
    try {
      const roundId = req.params.id as string;
      const data = await this.poolService.getRoundResults(roundId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  adminListRounds = async (req: Request, res: Response) => {
    try {
      const data = await this.poolService.listAllRoundsForAdmin();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  adminCreateRound = async (req: Request, res: Response) => {
    try {
      const durationHours = req.body?.durationHours !== undefined ? Number(req.body.durationHours) : undefined;
      const data = await this.poolService.createRound(durationHours);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  adminCloseRound = async (req: Request, res: Response) => {
    try {
      const admin = (req as any).user;
      const roundId = req.params.id as string;
      const data = await this.poolService.closeRound(roundId, admin);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };
}
