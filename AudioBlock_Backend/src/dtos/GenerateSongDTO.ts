import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from "class-validator";

export class GenerateSongDTO {
  @IsString()
  @IsNotEmpty({ message: "Prompt is required." })
  prompt!: string;

  @IsString()
  @IsNotEmpty({ message: "Song title is required." })
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  composers?: string;

  @IsNumber()
  @IsOptional()
  @Min(5, { message: "durationSeconds must be at least 5." })
  @Max(30, { message: "durationSeconds must be at most 30." })
  durationSeconds?: number;
}
