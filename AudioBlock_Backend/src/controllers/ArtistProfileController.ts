import { validateOrReject } from "class-validator";
import { UpdateArtistProfileDTO } from "../dtos/UpdateArtistProfileDTO";
import { ArtistProfileService } from "../services/ArtistProfileService";
import { handleError } from "../utils/helpers";
import { Request, Response } from "express";
import fs from "fs";
import AppDataSource from "../config/db";
import { User, UserRole } from "../entities/User";
import { signS3Url } from "../utils/s3";

export class ArtistProfileController {
  private artistProfileService: ArtistProfileService;

  constructor() {
    this.artistProfileService = new ArtistProfileService();
  }

  // Public — no auth. Only ever returns fields safe to show to any visitor;
  // never reuse the full User entity here (it also carries email, role,
  // rewardPoints, wallet-linked internals, etc).
  getPublicProfile = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userRepo = AppDataSource.getRepository(User);
      const artist = await userRepo.findOne({
        where: { id, role: UserRole.ARTIST },
      });

      if (!artist) {
        return res
          .status(404)
          .json({ success: false, message: "Artist not found" });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: artist.id,
          username: artist.username,
          name: artist.name,
          bio: artist.bio,
          profileImage: signS3Url(artist.profileImage),
          pageCover: signS3Url(artist.pageCover),
          instagram: artist.instagram,
          walletAddress: artist.walletAddress,
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: user not found in token",
        });
      }

      // combine body + uploaded files into DTO
      const dto = Object.assign(new UpdateArtistProfileDTO(), {
        ...req.body,
        profileImage: (req as any).files?.["profileImage"]?.[0],
        pageCover: (req as any).files?.["pageCover"]?.[0],
      });

      // validate DTO
      await validateOrReject(dto);
      const updatedProfile =
        await this.artistProfileService.updateArtistProfile(userId, dto);
      return res.status(200).json({
        success: true,
        data: {
          ...updatedProfile,
          profileImage: signS3Url(updatedProfile.profileImage),
          pageCover: signS3Url(updatedProfile.pageCover),
        },
      });
    } catch (error) {
      handleError(res, error);
    } finally {
      // optional: clean up temp uploads if validation fails
      if (req.files) {
        Object.values(req.files).forEach((arr: any) =>
          arr.forEach(
            (f: any) => fs.existsSync(f.path) && fs.unlinkSync(f.path)
          )
        );
      }
    }
  };
}
