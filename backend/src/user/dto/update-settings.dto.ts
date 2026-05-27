import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  // HH:MM 24h
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'reminderTime must be in HH:MM 24h format' })
  reminderTime?: string;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;
}
