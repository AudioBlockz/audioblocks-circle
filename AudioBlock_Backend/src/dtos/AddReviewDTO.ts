import { IsInt, Min, Max, IsString, IsNotEmpty } from "class-validator";

export class AddReviewDTO {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
