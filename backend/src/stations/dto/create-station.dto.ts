import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStationDto {
  @ApiProperty({ example: 'สถานีวัดน้ำ คลองชัยนาท' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15.185 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 100.133 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: 6.52 })
  @IsOptional()
  @IsNumber()
  waterLevel?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsOptional()
  @IsNumber()
  rainLevel?: number;

  @ApiPropertyOptional({ enum: ['normal', 'warning', 'critical', 'offline'], default: 'normal' })
  @IsOptional()
  @IsEnum(['normal', 'warning', 'critical', 'offline'])
  status?: string;

  @ApiPropertyOptional({ example: 7.0 })
  @IsOptional()
  @IsNumber()
  leftBank?: number;

  @ApiPropertyOptional({ example: 7.2 })
  @IsOptional()
  @IsNumber()
  rightBank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bedData?: string;

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @IsNumber()
  warningLevel?: number;
}
