import { Router } from "express";
import { CollectionController } from "../controllers/CollectionController";
import { validateDTO } from "../middlewares/validate";
import { CreateCollectionDTO } from "../dtos/CreateCollectionDTO";
import { RespondToCollectionInviteDTO } from "../dtos/RespondToCollectionInviteDTO";
import { authArtistMiddleware } from "../middlewares/authMiddleware";

const collectionController = new CollectionController();
const router = Router();

// All collection actions are artist-only (listeners have no role here).
router.post("/", authArtistMiddleware, validateDTO(CreateCollectionDTO), collectionController.create);
router.get("/mine", authArtistMiddleware, collectionController.listMine);
router.get("/invites/pending", authArtistMiddleware, collectionController.listPendingInvites);
router.get("/:id", authArtistMiddleware, collectionController.getById);
router.post(
  "/:id/respond",
  authArtistMiddleware,
  validateDTO(RespondToCollectionInviteDTO),
  collectionController.respondToInvite
);
router.post("/:id/songs", authArtistMiddleware, collectionController.attachSong);

export default router;
