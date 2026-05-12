import { IsString, IsUrl, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertConfigDto {
  @ApiProperty({ example: 'กรมชลประทาน API' }) @IsString() name: string;
  @ApiProperty({ example: 'https://api.rid.go.th/v1/telemetry' }) @IsUrl() apiEndpoint: string;
  @ApiPropertyOptional() @IsOptional() @IsString() apiKey?: string;
  @ApiPropertyOptional({ default: 300, description: 'วินาที' }) @IsOptional() @IsInt() @Min(60) sendInterval?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() enabled?: boolean;
}
