import { IsString, MinLength, IsOptional } from 'class-validator';

export class GuestLoginDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;
}
