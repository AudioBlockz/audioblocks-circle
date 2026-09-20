import { Request, Response } from "express";
import { ReviewService } from "../services/ReviewService";
import { handleError } from "../utils/helpers";

export class ReviewController {
  private reviewService = new ReviewService();

  listReviews = async (req: Request, res: Response) => {
    try {
      const data = await this.reviewService.listReviews(req.params.id as string);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  addReview = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { rating, content } = req.body;
      const data = await this.reviewService.addReview(user.id, req.params.id as string, rating, content);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };
}
