import { Request, Response } from "express";
import { CollectionService } from "../services/CollectionService";
import { handleError } from "../utils/helpers";

export class CollectionController {
  private collectionService = new CollectionService();

  create = async (req: Request, res: Response) => {
    try {
      const creator = (req as any).user;
      const { title, description, creatorSplitBps, members } = req.body;
      const data = await this.collectionService.createCollection(
        creator,
        title,
        description,
        creatorSplitBps,
        members
      );
      return res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  listMine = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const data = await this.collectionService.listMyCollections(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  listPendingInvites = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const data = await this.collectionService.listPendingInvites(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const data = await this.collectionService.getCollectionById(req.params.id as string, userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  respondToInvite = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { status } = req.body;
      const data = await this.collectionService.respondToInvite(userId, req.params.id as string, status);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };

  attachSong = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { songId } = req.body;
      const data = await this.collectionService.attachSong(userId, songId, req.params.id as string);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  };
}
