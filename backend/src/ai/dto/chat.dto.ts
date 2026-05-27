import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
