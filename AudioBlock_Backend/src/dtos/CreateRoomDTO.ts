import { IsUUID, IsString, IsNotEmpty, IsOptional, IsISO8601, Matches } from "class-validator";

export class CreateRoomDTO {
  // Must already be uploaded via the normal /api/song/upload flow and owned
  // by the requesting artist — RoomService.createRoom checks both.
  @IsUUID()
  songId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // A human decimal USDC amount, e.g. "5" or "5.50" — base-unit conversion
  // (6 decimals) happens in RoomService, not here.
  @Matches(/^\d+(\.\d+)?$/, { message: "price must be a positive decimal string" })
  price!: string;

  @IsISO8601()
  accessStartsAt!: string;

  @IsISO8601()
  accessEndsAt!: string;
}
