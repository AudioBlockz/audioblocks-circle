import {Router} from "express";
import { UploadController } from "../controllers/UploadController";
import { validateDTO } from "../middlewares/validate";
import { FinalizeUploadDTO } from "../dtos/FinalizeUploadDTO";
import { UploadChunkDTO } from "../dtos/UploadChunkDTO";
import { authArtistMiddleware, authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware";
import multer from "multer";
import { CreateCoverDTO } from "../dtos/CreateCoverDTO";
import fs from "fs";
import { SongController } from "../controllers/SongController";
import { SongInteractionController } from "../controllers/SongInteractionController";
import { AIGenerationController } from "../controllers/AIGenerationController";
import { GenerateSongDTO } from "../dtos/GenerateSongDTO";
import { AddCommentDTO } from "../dtos/AddCommentDTO";

const uploadController = new UploadController();
const aiGenerationController = new AIGenerationController();
const router = Router();
// const upload = multer({ dest: "uploads/chunks/" });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp";
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep multer's default random filename
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}`);
  }
});

const upload = multer({ storage });
// const upload = multer({ dest: "uploads/temp/" });
router.post("/upload/chunk", authArtistMiddleware, upload.single("chunk"), validateDTO(UploadChunkDTO), uploadController.uploadChunk);
router.post("/upload/cover", authArtistMiddleware, upload.single("cover"), validateDTO(CreateCoverDTO), uploadController.uploadCover);
router.post("/upload/finalize", authArtistMiddleware, validateDTO(FinalizeUploadDTO), uploadController.finalizeUpload);


// Browse + stream songs
router.get("/", optionalAuthMiddleware, SongController.listSongs);
router.get("/stats/mine", authArtistMiddleware, SongController.getMyStats);
router.get("/stream/:id", optionalAuthMiddleware, SongController.streamSong);
// One quality rendition of an adaptive-bitrate song — see SongController.streamVariant.
router.get("/stream/:id/:rendition", optionalAuthMiddleware, SongController.streamVariant);

// Likes + comments
router.post("/:id/like", authMiddleware, SongInteractionController.toggleLike);
router.get("/:id/comments", SongInteractionController.listComments);
router.post("/:id/comments", authMiddleware, validateDTO(AddCommentDTO), SongInteractionController.addComment);
// Mood matching calls out to an LLM and can comfortably exceed app.ts's
// global 30s request timeout — override it just for this route rather than
// loosening the timeout everywhere.
router.post(
  "/mood-match",
  (req, res, next) => {
    req.setTimeout(120000);
    res.setTimeout(120000);
    next();
  },
  SongController.moodMatch
);

// AI music generation
router.post("/ai/generate", authArtistMiddleware, validateDTO(GenerateSongDTO), aiGenerationController.generateSong);

export default router;