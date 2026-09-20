// src/dtos/CreateUserDto.ts
import { IsEmail, IsEnum, IsOptional, IsString, IsNumber, IsNotEmpty } from "class-validator";
import { UserRole } from "../entities/User";

export class CreateUserDTO {

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsString()
  @IsNotEmpty({ message: "Privy user id is required." })
  privyUserId!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsNotEmpty({ message: "Wallet address is required." })
  walletAddress!: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsNumber()
  rewardPoints?: number;

  @IsOptional()
  @IsNumber()
  totalStreams?: number;

  @IsOptional()
  @IsNumber()
  totalStreamTime?: number;

  @IsOptional()
  @IsNumber()
  uniqueListeners?: number;

}
