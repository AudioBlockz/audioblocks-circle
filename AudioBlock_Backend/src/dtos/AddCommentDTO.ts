import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class AddCommentDTO {
  @IsString()
  @IsNotEmpty({ message: "Comment content is required." })
  @MaxLength(1000, { message: "Comment must be at most 1000 characters." })
  content!: string;
}
