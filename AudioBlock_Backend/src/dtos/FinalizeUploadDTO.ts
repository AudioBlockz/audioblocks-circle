import { int } from './../../node_modules/aws-sdk/clients/datapipeline.d';
// src/dtos/CreateUserDto.ts
import { IsEmail, IsEnum, IsOptional, IsString, IsNumber, IsNotEmpty, IsArray, ArrayMinSize, IsBoolean } from "class-validator";
import { Song, SongMood } from "../entities/Song";

export class FinalizeUploadDTO {

  @IsString()
  @IsNotEmpty({ message: "File ID is required." })
  fileId!: string;

  @IsNumber()
  @IsNotEmpty({ message: "Total chunks is required." })
  totalChunks!: number;

  @IsString()
  @IsNotEmpty({ message: "Song title address is required." })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: "Song description is required." })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: "Song genre is required." })
  genre!: string;

  @IsArray({ message: "mood must be an array of at least one mood." })
  @ArrayMinSize(1, { message: "Select at least one mood." })
  @IsEnum(SongMood, { each: true, message: "mood must each be one of: " + Object.values(SongMood).join(", ") })
  mood!: SongMood[];

  @IsString()
  @IsNotEmpty({ message: "Cover art path is required." })
  coverArtPath!: string;

  @IsString()
  @IsOptional()
  composers?: string;

  // Set by the "upload for a listening Room" flow (CreateRoom.tsx) so the
  // track is created hidden from the public catalogue from the very first
  // moment it exists — never a plain unauthenticated upload that gets
  // converted to a Room afterwards, which would leave it briefly public.
  // See Song.unreleased and RoomService.createRoom.
  @IsOptional()
  @IsBoolean()
  unreleased?: boolean;
}