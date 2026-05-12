import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingDto {
  @ApiPropertyOptional({ description: 'เวลาบันทึก (ISO 8601) ถ้าไม่ระบุใช้เวลาปัจจุบัน' })
  @IsOptional()
  @IsDateString()
  time?: string;

  @ApiPropertyOptional({ example: 6.52 })
  @IsOptional()
  @IsNumber()
  waterLevel?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  rainLevel?: number;

  @ApiPropertyOptional({ example: 124.5 })
  @IsOptional()
  @IsNumber()
  flowRate?: number;
}
