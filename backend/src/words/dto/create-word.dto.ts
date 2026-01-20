import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWordDto {
  @ApiProperty({ example: '你好' })
  @IsString()
  @IsNotEmpty()
  character: string;

  @ApiProperty({ example: 'nǐ hǎo' })
  @IsString()
  @IsNotEmpty()
  pinyin: string;

  @ApiProperty({ example: 'Привет' })
  @IsString()
  @IsNotEmpty()
  translation: string;
}