import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CollectionMemberInputDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  // Basis points, e.g. 2500 = 25%. Does not include the creator's own
  // share — that's supplied separately as creatorSplitBps.
  @IsInt()
  @Min(1)
  splitBps!: number;
}

export class CreateCollectionDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  creatorSplitBps!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CollectionMemberInputDTO)
  members!: CollectionMemberInputDTO[];
}
