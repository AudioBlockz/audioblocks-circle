import { IsNotEmpty, IsString } from "class-validator";

export class VoteDTO {
  @IsString()
  @IsNotEmpty()
  songId!: string;
}
