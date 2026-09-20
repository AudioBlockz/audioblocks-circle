import { IsIn } from "class-validator";

export class RespondToCollectionInviteDTO {
  @IsIn(["accepted", "declined"])
  status!: "accepted" | "declined";
}
