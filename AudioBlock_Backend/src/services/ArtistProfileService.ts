import { Repository } from "typeorm";
import AppDataSource from "../config/db";
import { User } from "../entities/User";
import fs from "fs";
import { s3 } from "../config/s3";
import { UpdateArtistProfileDTO } from "../dtos/UpdateArtistProfileDTO";
import path from "path";

export class ArtistProfileService {
  private userRepo: Repository<User>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  private async uploadToS3(localPath: string, folder: string) {
    const buffer = fs.readFileSync(localPath);
    const fileId = crypto.randomUUID();
    const fileName = `${fileId}_${path.basename(localPath)}`;

    const upload = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `${folder}/${fileName}`,
        Body: buffer,
        ContentType: "image/png",
      })
      .promise();

    fs.unlinkSync(localPath); // clean temp
    return upload.Location;
  }

  async updateArtistProfile(
    userId: string,
    profileData: Partial<UpdateArtistProfileDTO>
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Prepare the update data with processed files
    // exclude file objects (profileImage, pageCover) before assigning to Partial<User>
    const { profileImage, pageCover, ...rest } = profileData;
    const updateData: Partial<User> = { ...rest };

    // Accept a bare handle, "@handle", or a full profile URL and normalize
    // to just the handle — instagram.com/<handle> is built from this on
    // display (see ArtistProfileController), so a stray "@" or pasted URL
    // would otherwise break that link.
    if (typeof updateData.instagram === "string") {
      updateData.instagram = updateData.instagram
        .trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/+$/, "") || undefined;
    }

    // upload profile image if provided
    if (
      profileData.profileImage &&
      typeof profileData.profileImage === "object" &&
      "path" in profileData.profileImage
    ) {
      const uploadedUrl = await this.uploadToS3(
        profileData.profileImage.path,
        "profile-images"
      );
      updateData.profileImage = uploadedUrl;
    }

    // upload page cover if provided
    if (
      profileData.pageCover &&
      typeof profileData.pageCover === "object" &&
      "path" in profileData.pageCover
    ) {
      const uploadedUrl = await this.uploadToS3(
        profileData.pageCover.path,
        "page-covers"
      );
      updateData.pageCover = uploadedUrl;
    }

    Object.assign(user, updateData);

    // Save the updated user


    return this.userRepo.save(user);
  }
}
