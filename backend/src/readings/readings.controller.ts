import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReadingsService } from './readings.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('readings')
@Controller()
export class ReadingsController {
  constructor(private readingsService: ReadingsService) {}

  @Get('readings/latest')
  @ApiOperation({ summary: 'ดูค่าล่าสุดของทุกสถานี (public)' })
  getLatestAll() {
    return this.readingsService.getLatestAll();
  }

  @Get('stations/:id/readings')
  @ApiOperation({ summary: 'ดูประวัติค่าของสถานี (public)' })
  @ApiQuery({ name: 'hours', required: false, description: 'จำนวนชั่วโมงย้อนหลัง (default: 24)', example: 24 })
  getReadings(
    @Param('id', ParseIntPipe) id: number,
    @Query('hours') hours?: string,
  ) {
    return this.readingsService.getReadings(id, hours ? parseInt(hours) : 24);
  }

  @Post('stations/:id/readings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[JWT] บันทึกค่าใหม่สำหรับสถานี' })
  @ApiResponse({ status: 201 })
  addReading(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateReadingDto) {
    return this.readingsService.addReading(id, dto);
  }
}
