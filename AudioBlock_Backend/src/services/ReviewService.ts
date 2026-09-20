import AppDataSource from "../config/db";
import { Review } from "../entities/Review";
import { RoomTicket, RoomTicketStatus } from "../entities/RoomTicket";
import { getDisplayName } from "../utils/helpers";
import { signS3Url } from "../utils/s3";

// Reviews are gated on having actually paid for the room — see addReview —
// so listing needs no separate access check: anyone (including logged-out
// visitors) can read what paying fans said.
export class ReviewService {
  private reviewRepo = AppDataSource.getRepository(Review);
  private ticketRepo = AppDataSource.getRepository(RoomTicket);

  async addReview(userId: string, roomId: string, rating: number, content: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { roomId, userId, status: RoomTicketStatus.SUCCEEDED },
    });
    if (!ticket) {
      throw new Error("ReviewService: buy a ticket for this room before reviewing it");
    }

    const existing = await this.reviewRepo.findOne({ where: { roomId, userId } });
    if (existing) {
      existing.rating = rating;
      existing.content = content;
      const saved = await this.reviewRepo.save(existing);
      return this.serialize(saved, { id: userId });
    }

    const review = await this.reviewRepo.save(this.reviewRepo.create({ roomId, userId, rating, content }));
    return this.serialize(review, { id: userId });
  }

  async listReviews(roomId: string) {
    const reviews = await this.reviewRepo.find({
      where: { roomId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
    return reviews.map((r) => this.serialize(r, r.user));
  }

  private serialize(review: Review, user?: { id: string; username?: string; name?: string; email?: string; profileImage?: string }) {
    return {
      id: review.id,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
      user: {
        id: user?.id,
        name: getDisplayName(user),
        profileImage: user?.profileImage ? signS3Url(user.profileImage) : null,
      },
    };
  }
}
