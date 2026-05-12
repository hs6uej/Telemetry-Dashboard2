import { IsString, IsBoolean, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: ['admin', 'user', 'pending'] })
  @IsOptional()
  @IsEnum(['admin', 'user', 'pending'])
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approved?: boolean;
}
