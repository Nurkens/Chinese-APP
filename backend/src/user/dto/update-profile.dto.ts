import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Emoji, URL, or base64 data URI (capped to ~1MB to avoid abuse)
  @IsOptional()
  @IsString()
  @MaxLength(1_500_000)
  avatar?: string;
}
