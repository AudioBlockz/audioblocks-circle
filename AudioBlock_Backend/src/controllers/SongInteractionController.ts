import { Request, Response } from "express";
import AppDataSource from "../config/db";
import { Song } from "../entities/Song";
import { SongLike } from "../entities/SongLike";
import { SongComment } from "../entities/SongComment";
import { handleError, getDisplayName } from "../utils/helpers";

export class SongInteractionController {
  static toggleLike = async (req: Request, res: Response) => {
    try {
      const songId = req.params.id as string;
      const userId = (req as any).user.id as string;

      const songRepo = AppDataSource.getRepository(Song);
      const likeRepo = AppDataSource.getRepository(SongLike);

      const song = await songRepo.findOne({ where: { id: songId } });
      if (!song) {
        return res.status(404).json({ success: false, message: "Song not found" });
      }

      const existing = await likeRepo.findOne({ where: { songId, userId } });
      let liked: boolean;
      if (existing) {
        await likeRepo.remove(existing);
        liked = false;
      } else {
        await likeRepo.save(likeRepo.create({ songId, userId }));
        liked = true;
      }

      const likeCount = await likeRepo.count({ where: { songId } });
      return res.status(200).json({ success: true, data: { liked, likeCount } });
    } catch (err) {
      console.error("Toggle like error:", err);
      handleError(res, err);
    }
  };

  static listComments = async (req: Request, res: Response) => {
    try {
      const songId = req.params.id as string;
      const commentRepo = AppDataSource.getRepository(SongComment);
      const comments = await commentRepo.find({
        where: { songId },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });

      const data = comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.user?.id,
          name: getDisplayName(c.user),
          profileImage: c.user?.profileImage || null,
        },
      }));

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error("List comments error:", err);
      handleError(res, err);
    }
  };

  static addComment = async (req: Request, res: Response) => {
    try {
      const songId = req.params.id as string;
      const user = (req as any).user;
      const content = (req.body?.content as string | undefined)?.trim();

      if (!content) {
        return res.status(400).json({ success: false, message: "Comment content is required" });
      }

      const songRepo = AppDataSource.getRepository(Song);
      const song = await songRepo.findOne({ where: { id: songId } });
      if (!song) {
        return res.status(404).json({ success: false, message: "Song not found" });
      }

      const commentRepo = AppDataSource.getRepository(SongComment);
      const comment = await commentRepo.save(
        commentRepo.create({ songId, userId: user.id, content })
      );

      return res.status(201).json({
        success: true,
        data: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: user.id,
            name: getDisplayName(user),
            profileImage: user.profileImage || null,
          },
        },
      });
    } catch (err) {
      console.error("Add comment error:", err);
      handleError(res, err);
    }
  };
}
